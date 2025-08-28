from app import app, db, Flashcards

with app.app_context():
    # Remove Card rows first (safe if FK constraint exists)
    # Remove Flashcards rows
    Flashcards.query.delete()
    db.session.commit()
    print("All flashcards and cards deleted.")