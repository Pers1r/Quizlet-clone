import secrets
from flask import Flask, render_template, url_for, request, redirect, jsonify, abort, session
from flask_login import LoginManager, login_user, logout_user, UserMixin, current_user, login_required
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.mutable import MutableList
import sqlalchemy as sa
from werkzeug.security import generate_password_hash, check_password_hash
import logging

app = Flask(__name__, static_folder='static', template_folder='templates')

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret'

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'log_in'


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Flashcards(db.Model):
    __tablename__ = 'flashcards'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(80), nullable=False)
    cards = db.Column(MutableList.as_mutable(sa.JSON), nullable=False, default=list)
    count_questions = db.Column(db.Integer, nullable=False, default=0)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user = db.relationship('User', backref='flashcards')


# ------------------
# Login loader + JSON-aware unauthorized handler
# ------------------
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.before_request
def ensure_csrf_token():
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_urlsafe(32)


def check_csrf_token():
    header = request.headers.get('X-CSRF-TOKEN') or request.headers.get('X-CSRFToken')
    if not header:
        return False
    return header == session.get('csrf_token')


@app.route('/')
def index():
    modules = Flashcards.query.order_by(Flashcards.id.desc()).all()
    current_user_data = {"username": current_user.username, "user_id": current_user.id} if current_user.is_authenticated else None
    return render_template(
        'index.html',
        modules=modules,
        current_user_data=current_user_data,
        csrf_token=session.get('csrf_token')
    )


@app.route('/auth')
def log_in():
    current_user_data = {"username": current_user.username, "user_id": current_user.id} if current_user.is_authenticated else None
    return render_template(
        'log_in.html',
        current_user_data=current_user_data,
        csrf_token=session.get('csrf_token')
    )


@app.route('/create')
@login_required
def create():
    current_user_data = {"username": current_user.username, "user_id": current_user.id} if current_user.is_authenticated else None
    return render_template('create_flashcards.html', current_user_data=current_user_data, csrf_token=session.get('csrf_token'))


@app.route('/flashcard_module/<int:flashcard_id>')
def flashcard_module(flashcard_id):
    f = Flashcards.query.get(flashcard_id)
    current_user_data = {"username": current_user.username, "user_id": current_user.id} if current_user.is_authenticated else None
    return render_template('flashcard_preview.html', f=f, csrf_token=session.get('csrf_token'), current_user_data=current_user_data)

# ------------------
# HELPERS
# ------------------
def json_payload():
    if request.is_json:
        return request.get_json()
    return request.form


# ------------------
# API: register / login / logout / me
# ------------------
@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.get_json()
        username = (data.get('username') or '').strip()
        password = data.get('password') or ''

        if not check_csrf_token():
            return jsonify({"error": "CSRF token is required"}), 400

        if not username:
            return jsonify({"error": "Username is required"}), 400

        if not password or len(password) < 4:
            return jsonify({"error": "Password must be at least 4 characters"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 409

        user = User(username=username)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User created", "user_id": user.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/login', methods=['POST'])
def api_login():
    data = json_payload()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400

    u = User.query.filter_by(username=username).first()
    if not u or not u.check_password(password):
        return jsonify({"error": "invalid username or password"}), 401

    login_user(u)
    return jsonify({'message': "logged in", "username": u.username, 'user_id': u.id}), 200


@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    logout_user()
    return jsonify({'message': "logged out"}), 200


@app.route('/api/me', methods=['GET'])
def api_me():
    if current_user.is_authenticated:
        return jsonify({'username': current_user.username, "user_id": current_user.id}), 200
    return jsonify({'username': None}), 200


@app.route('/api/modules', methods=['GET'])
def api_list_modules():
    modules = Flashcards.query.order_by(Flashcards.id.desc()).all()
    out = []
    for m in modules:
        out.append({
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "count_questions": m.count_questions,
            "owner_name": m.user.username,
            "user_id": m.user_id,
        })
    return jsonify(out), 200


@app.route('/api/modules', methods=['POST'])
@login_required
def api_create_module():
    data = json_payload()
    name = (data.get('name') or '').strip()
    description = data.get('description') or ''
    cards = data.get('cards') or []

    if not name:
        return jsonify({'error': 'module name is required'}), 400
    if not isinstance(cards, list):
        return jsonify({'error': 'cards must be a list'}), 400

    validated_cards = []
    for c in cards:
        term = c.get('term') if isinstance(c, dict) else None
        dfn = c.get('dfn') if isinstance(c, dict) else None
        if term and dfn:
            validated_cards.append({"term": str(term), "dfn": str(dfn)})

    f = Flashcards(
        name=name,
        description=description,
        cards=validated_cards,
        count_questions=len(validated_cards),
        user_id=current_user.id,
    )

    db.session.add(f)
    db.session.commit()
    return jsonify({'message': "created", "module_id": f.id}), 201


# @app.route('/flashcard_module/<int:flashcard_id>')
# def flashcard_module(flashcard_id):
#     flashcard = Flashcards.query.get(flashcard_id)
#     return render_template('flashcard_preview.html', f=flashcard)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
