from flask import Flask, render_template, url_for, request, redirect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.mutable import MutableList
import sqlalchemy as sa
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Flashcards(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(80), nullable=False)
    cards = db.Column(MutableList.as_mutable(sa.JSON), nullable=False, default=list)
    count_questions = db.Column(db.Integer, nullable=False, default=0)


@app.route('/')
def index():
    flashcards = Flashcards.query.all()
    return render_template('index.html', flashcards=flashcards)


@app.route('/create_flashcard_module', methods=['GET', 'POST'])
def create_flashcard_module():
    if request.method == 'POST':
        module_name = request.form['module_name']
        module_descr = request.form['module_descr']

        i = 1
        cards = []
        while True:
            term = request.form.get(f'term_{i}')
            dfn = request.form.get(f'definition_{i}')

            if term is None and dfn is None:
                break
            if term and dfn:
                cards.append({"term": term, "dfn": dfn})
            i += 1

        f = Flashcards(name=module_name, description=module_descr, cards=cards, count_questions=len(cards))
        db.session.add(f)
        db.session.commit()
        print("add:", module_name, module_descr)
        for x in cards:
            print(f"term: {x['term']}, dfn: {x['dfn']}")
        return redirect(url_for('index'))
    return render_template('create_flashcards.html')


@app.route('/flashcard_module/<int:flashcard_id>')
def flashcard_module(flashcard_id):
    flashcard = Flashcards.query.get(flashcard_id)
    return render_template('flashcard_preview.html', f=flashcard)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
