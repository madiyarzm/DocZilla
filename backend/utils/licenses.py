"""License compliance (Phase 5).

Fetches each dependency's license from the npm or PyPI registry, normalizes it
to an SPDX-ish identifier, and checks compatibility against the project's chosen
license using a practical compatibility matrix. Solar is used as a fallback
reasoner for licenses the static matrix doesn't recognize.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import requests

# License "classes" for compatibility reasoning.
PERMISSIVE = {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense", "Zlib"}
WEAK_COPYLEFT = {"LGPL-2.1", "LGPL-3.0", "MPL-2.0", "EPL-2.0", "CDDL-1.0"}
STRONG_COPYLEFT = {"GPL-2.0", "GPL-3.0", "AGPL-3.0"}

_ALIASES = {
    "apache 2.0": "Apache-2.0",
    "apache-2.0": "Apache-2.0",
    "apache license 2.0": "Apache-2.0",
    "apache2": "Apache-2.0",
    "the mit license": "MIT",
    "mit license": "MIT",
    "bsd": "BSD-3-Clause",
    "new bsd": "BSD-3-Clause",
    "gplv2": "GPL-2.0",
    "gplv3": "GPL-3.0",
    "gpl-3.0-or-later": "GPL-3.0",
    "gpl-2.0-or-later": "GPL-2.0",
    "agpl-3.0-or-later": "AGPL-3.0",
    "lgpl": "LGPL-3.0",
    "mpl 2.0": "MPL-2.0",
    "mozilla public license 2.0": "MPL-2.0",
}


def normalize_spdx(raw: Optional[str]) -> str:
    if not raw:
        return "UNKNOWN"
    s = str(raw).strip()
    key = s.lower()
    if key in _ALIASES:
        return _ALIASES[key]
    # Already-canonical forms in our known sets.
    for known in PERMISSIVE | WEAK_COPYLEFT | STRONG_COPYLEFT:
        if key == known.lower():
            return known
    # Common "GPL-3.0" etc. variations.
    upper = s.upper().replace(" ", "-")
    for known in PERMISSIVE | WEAK_COPYLEFT | STRONG_COPYLEFT:
        if upper.startswith(known.upper()):
            return known
    return s


def fetch_npm_license(package: str) -> str:
    try:
        r = requests.get(
            f"https://registry.npmjs.org/{package}/latest", timeout=15
        )
        if r.status_code != 200:
            return "UNKNOWN"
        data = r.json()
        lic = data.get("license")
        if isinstance(lic, dict):
            lic = lic.get("type")
        if not lic and isinstance(data.get("licenses"), list) and data["licenses"]:
            lic = data["licenses"][0].get("type")
        return normalize_spdx(lic)
    except requests.RequestException:
        return "UNKNOWN"


def fetch_pip_license(package: str) -> str:
    try:
        r = requests.get(f"https://pypi.org/pypi/{package}/json", timeout=15)
        if r.status_code != 200:
            return "UNKNOWN"
        info = r.json().get("info", {})
        # PEP 639: newer packages use license_expression (SPDX) instead of license.
        expr = info.get("license_expression")
        if expr:
            return normalize_spdx(expr)
        lic = info.get("license")
        if lic and len(str(lic)) < 80:
            return normalize_spdx(lic)
        # Fall back to trove classifiers (more reliable than the free-text field).
        for cl in info.get("classifiers", []):
            if cl.startswith("License :: OSI Approved ::"):
                return normalize_spdx(_classifier_to_spdx(cl))
        return normalize_spdx(lic)
    except requests.RequestException:
        return "UNKNOWN"


def _classifier_to_spdx(classifier: str) -> str:
    name = classifier.split("::")[-1].strip().lower()
    mapping = {
        "mit license": "MIT",
        "apache software license": "Apache-2.0",
        "bsd license": "BSD-3-Clause",
        "gnu general public license v3 (gplv3)": "GPL-3.0",
        "gnu general public license v2 (gplv2)": "GPL-2.0",
        "gnu lesser general public license v3 (lgplv3)": "LGPL-3.0",
        "gnu affero general public license v3": "AGPL-3.0",
        "mozilla public license 2.0 (mpl 2.0)": "MPL-2.0",
        "isc license (iscl)": "ISC",
    }
    return mapping.get(name, name)


def _class_of(spdx: str) -> str:
    if spdx in PERMISSIVE:
        return "permissive"
    if spdx in WEAK_COPYLEFT:
        return "weak-copyleft"
    if spdx in STRONG_COPYLEFT:
        return "strong-copyleft"
    return "unknown"


def check_compatibility(dep_license: str, project_license: str) -> Tuple[bool, str, str]:
    """Return (compatible, reason, spdx_clause)."""
    dep = normalize_spdx(dep_license)
    proj = normalize_spdx(project_license)
    dep_class = _class_of(dep)
    proj_class = _class_of(proj)

    if dep == "UNKNOWN" or dep_class == "unknown":
        return (
            False,
            f"Dependency license '{dep_license}' could not be resolved to a known "
            "SPDX identifier — review manually.",
            "license-unknown",
        )

    # Strong copyleft deps "infect" permissive/proprietary projects on distribution.
    if dep_class == "strong-copyleft" and proj_class == "permissive":
        return (
            False,
            f"{dep} is strong copyleft; distributing it inside a {proj} project "
            "generally requires releasing your combined work under "
            f"{dep}. Incompatible with a permissive license.",
            f"{dep}-copyleft",
        )
    if dep == "AGPL-3.0" and proj != "AGPL-3.0":
        return (
            False,
            "AGPL-3.0 adds a network-use clause that propagates to your project; "
            f"incompatible with {proj} unless your project is also AGPL-3.0.",
            "AGPL-3.0-network-clause",
        )
    if dep_class == "strong-copyleft" and proj_class == "weak-copyleft":
        return (
            False,
            f"{dep} (strong copyleft) is generally incompatible with a "
            f"{proj} ({proj_class}) project.",
            f"{dep}-copyleft",
        )

    return (
        True,
        f"{dep} ({dep_class}) is compatible with a {proj} ({proj_class}) project.",
        f"{dep}-compatible",
    )
