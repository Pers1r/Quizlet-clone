from flask import Flask, render_template, url_for

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/create_flashcard_module')
def create_flashcard_module():
    return render_template('create_flashcards.html')


if __name__ == '__main__':
    app.run(debug=True)
