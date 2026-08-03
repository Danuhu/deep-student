"""Generate a small standards-compliant APKG outside Deep Student's exporter."""

from pathlib import Path

import genanki


OUTPUT = Path("/private/tmp/chatanki-external-basic-cloze.apkg")


def main() -> None:
    basic = genanki.Model(
        1_607_392_319,
        "ChatAnki E2E External Basic",
        fields=[{"name": "Front"}, {"name": "Back"}],
        templates=[
            {
                "name": "Card 1",
                "qfmt": "{{Front}}",
                "afmt": "{{FrontSide}}<hr id=answer>{{Back}}",
            }
        ],
    )
    cloze = genanki.Model(
        1_607_392_320,
        "ChatAnki E2E External Cloze",
        fields=[{"name": "Text"}, {"name": "Extra"}],
        templates=[
            {
                "name": "Cloze",
                "qfmt": "{{cloze:Text}}",
                "afmt": "{{cloze:Text}}<br>{{Extra}}",
            }
        ],
        model_type=genanki.Model.CLOZE,
    )
    deck = genanki.Deck(2_057_940_111, "ChatAnki External Basic and Cloze")
    deck.add_note(
        genanki.Note(
            model=basic,
            fields=["What does CAS protect?", "It rejects writes based on a stale version."],
            tags=["chatanki-external", "basic"],
            guid="chatanki-external-basic-1",
        )
    )
    deck.add_note(
        genanki.Note(
            model=cloze,
            fields=[
                "Paris is the {{c1::capital}} of France.",
                "The hidden answer is capital.",
            ],
            tags=["chatanki-external", "cloze"],
            guid="chatanki-external-cloze-1",
        )
    )
    deck.add_note(
        genanki.Note(
            model=cloze,
            fields=[
                "A quorum overlaps when {{c1::R + W > N}} and a stale leader is rejected by a {{c2::fencing token}}.",
                "This note intentionally produces two Anki card rows.",
            ],
            tags=["chatanki-external", "cloze", "multi-ord"],
            guid="chatanki-external-cloze-2",
        )
    )

    genanki.Package(deck).write_to_file(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
