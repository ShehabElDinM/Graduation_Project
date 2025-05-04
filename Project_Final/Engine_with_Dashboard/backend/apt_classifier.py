import json

class APTClassifier:
    def __init__(self, rules_path="apt_rules.json"):
        with open(rules_path, "r", encoding="utf-8") as f:
            self.rules = json.load(f)

    def analyze_apt(self, email_body, email_subject="", attachment_filenames=None):
        if attachment_filenames is None:
            attachment_filenames = []

        email_body = email_body.lower()
        email_subject = email_subject.lower()
        attachments = [name.lower() for name in attachment_filenames]

        detected_apts = set()
        detected_techniques = set()
        detected_tactics = set()

        for technique_id, technique_data in self.rules.items():
            technique_name = technique_data.get("technique", "")
            tactic_name = technique_data.get("tactic", "")

            for procedure in technique_data.get("procedures", []):
                apt_group = procedure.get("apt_group", "")
                patterns = procedure.get("patterns", [])

                for pattern in patterns:
                    pattern = pattern.lower()

                    if (
                        pattern in email_body
                        or pattern in email_subject
                        or any(pattern in filename for filename in attachments)
                    ):
                        detected_apts.add(apt_group)
                        detected_techniques.add(f"{technique_name} ({technique_id})")
                        detected_tactics.add(tactic_name)

        if not detected_apts:
            return {
                "apt_groups": "Unknown",
                "techniques": "Unknown",
                "tactics": "Unknown"
            }

        return {
            "apt_groups": "Probably " + ", ".join(sorted(detected_apts)),
            "techniques": ", ".join(sorted(detected_techniques)),
            "tactics": ", ".join(sorted(detected_tactics))
        }
