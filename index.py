import os
from flask import Flask, render_template, jsonify, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, extract
from datetime import datetime
from dotenv import load_dotenv
from flask_dance.contrib.google import make_google_blueprint, google
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from dateutil import parser

load_dotenv()
#https://console.cloud.google.com/apis/credentials?project=life-436717

app = Flask(__name__)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
# app.config['SQLALCHEMY_DATABASE_URI'] = "mysql://wp:123@pinas.local/life_db"
db = SQLAlchemy(app)

app.secret_key = os.urandom(24)

login_manager = LoginManager(app)

google_bp = make_google_blueprint(client_id=os.getenv("GOOGLE_CLIENT_ID"),
                                  client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
                                  redirect_to="google_login",
                                  scope=["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile", "openid"]
)
app.register_blueprint(google_bp, url_prefix="/login")

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    picture = db.Column(db.String(300), nullable=True)
    last_visited_wallet_id = db.Column(db.Integer, db.ForeignKey('wallet.id'))
    wallets = db.relationship("Wallet", secondary="user_wallet", back_populates="users")
    
    def get_id(self):
        return str(self.id)
user_wallet = db.Table('user_wallet',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('wallet_id', db.Integer, db.ForeignKey('wallet.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    description = db.Column(db.String(300), nullable=True)
    users = db.relationship("User", secondary="user_wallet", back_populates="wallets")

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category_parent = db.Column(db.Integer)
    number_of_operation = db.Column(db.Integer)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    money_transfer_id = db.Column(db.Integer, db.ForeignKey('money_transfer.id'))
    
    category = db.relationship('Category', backref=db.backref('tags', lazy=True))
    money_transfer = db.relationship('MoneyTransfer', backref=db.backref('tags', lazy=True))

class MoneyTransfer(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    wallet_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable = False)
    description = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modifed_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, nullable=False)

def to_json(object):
    dict = {c.key: getattr(object, c.key) for c in inspect(object).mapper.column_attrs}
    return jsonify(dict)

def add_data(object, label):
    try:
        db.session.add(object)
        db.session.commit()
    except:
        return jsonify({"message": "Error while addind a "+label}), 500

    return jsonify({"message": label +" added successfully"}), 200

def remove_data(object, label):
    try:
        db.session.delete(object)
        db.session.commit()
    except:
        return jsonify({"message": "Error while removing a "+label}), 500
    return jsonify({"message": label+" removed successfully"}), 200
# ----- END POINTS Wallets -----
@app.route("/wallet/<int:id>", methods=['GET'])
def wallet(id):
    return to_json(Wallet.query.get_or_404(id))

@app.route("/add_wallet", methods=['POST'])
def add_wallet():
    data = request.json
    new_user = Wallet(name=data["name"], description=data["description"])
    return add_data(new_user, 'Wallet')

# ----- END POINTS USERS -----
@app.route("/user/<int:id>", methods=['GET'])
def user(id):
    return to_json(User.query.get_or_404(id))

@app.route("/remove_user/<int:id>", methods=['DELETE'])
def remove_user(id):
    user_to_delete = User.query.get_or_404(id)
    return remove_data(user_to_delete, 'User')

# ----- END POINTS CATEGORIES -----
@app.route("/category/<int:id>", methods=['GET'])
def category(id):
    return to_json(Category.query.get_or_404(id))

@app.route("/add_category", methods=['POST'])
def add_category():
    data = request.json
    new_category = Category(
        name=data["name"], 
        category_parent = data["category_parent"],
        number_of_operation = data["number_of_operation"])
    return add_data(new_category, 'Category')

@app.route("/remove_category/<int:id>", methods=['DELETE'])
def remove_category(id):
    category_to_delete = Category.query.get_or_404(id)
    return remove_data(category_to_delete, "Category")

# ----- END POINTS TAGS -----
@app.route("/tag/<int:id>", methods=['GET'])
def tag(id):
    return to_json(Tag.query.get_or_404(id))

@app.route("/add_tag", methods=['POST'])
def add_tag():
    data = request.json
    new_category = Tag(category_id=data["category_id"], money_transfer_id=data["money_transfer_id"])
    return add_data(new_category, 'Tag')

@app.route("/remove_tag/<int:id>", methods=['DELETE'])
def remove_tag(id):
    tag_to_delete = Tag.query.get_or_404(id)
    return remove_data(tag_to_delete, "Tag")

# ----- END POINTS MoneyTransfer -----
@app.route("/money/<int:id>", methods=['GET'])
def money(id):
    return to_json(MoneyTransfer.query.get_or_404(id))

@app.route("/edit_money", methods=['POST'])
def edit_money():
    data = request.json
    edited_money_transfer = MoneyTransfer.query.filter_by(id=data["id"]).first()
    
    if edited_money_transfer is None:
        return jsonify({"error": "MoneyTransfer not found"}), 404

    edited_money_transfer.amount = data["amount"]
    edited_money_transfer.description = data["description"]
    edited_money_transfer.modified_at = datetime.utcnow()

    Tag.query.filter_by(money_transfer_id=edited_money_transfer.id).delete()

    for tag_name in data["tags"]:
        category = Category.query.filter_by(name=tag_name).first()
        
        if not category:
            category = Category(name=tag_name, category_parent=None, number_of_operation=0)
            db.session.add(category)
            db.session.flush()

        new_tag = Tag(category_id=category.id, money_transfer_id=edited_money_transfer.id)
        db.session.add(new_tag)

    try:
        db.session.commit()
        return jsonify({"message": "MoneyTransfer edited successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/add_money", methods=['POST'])
@login_required
def add_money():
    data = request.json
    created_at = data.get("created_at")
    if created_at:
        try:
            created_at = parser.parse(created_at)  # Parsear la fecha desde el string ISO8601
        except ValueError:
            created_at = datetime.utcnow()  # Si falla el parseo, usar la fecha actual
    else:
        created_at = datetime.utcnow()  # Usar la fecha actual si no se proporciona
    
    new_money_transfer = MoneyTransfer(
        amount=data["amount"],
        description=data["description"],
        created_at=created_at,
        user_id=current_user.id,
        wallet_id=current_user.last_visited_wallet_id)
    result = add_data(new_money_transfer, 'MoneyTransfer')
    for tag_name in data["tags"]:
        category = Category.query.filter_by(name=tag_name).first()
        
        if not category:
            category = Category(name=tag_name, category_parent=None, number_of_operation=0)
            db.session.add(category)
            db.session.flush()

        new_tag = Tag(category_id=category.id, money_transfer_id=new_money_transfer.id)
        db.session.add(new_tag)

    db.session.commit()
    return result

def collect_tags_from(transfers):
    transfers_json = []
    for transfer in transfers:
        tags = [
            {
                'id': tag.category.id,
                'name': tag.category.name
            }
            for tag in transfer.tags
        ]
        transfer_json = {
            'id': transfer.id,
            'description': transfer.description,
            'amount': transfer.amount,
            'created_at': transfer.created_at.isoformat(),
            'modifed_at': transfer.created_at.isoformat(),
            'tags': tags
        }

        transfers_json.append(transfer_json)

    return jsonify(transfers_json)

@app.route("/last_money_transfers/<int:limit>", methods=['GET'])
@login_required
def last_money_transfers(limit):
    if limit < 0:
        limit = 10
    last_transfers = (
        db.session.query(MoneyTransfer)
        .filter(MoneyTransfer.wallet_id == current_user.last_visited_wallet_id)
        .order_by(MoneyTransfer.created_at.desc())
        .limit(limit)
        .all()
    )
    return collect_tags_from(last_transfers)

@app.route("/money_transfers_by_category/<int:category_id>", methods=['GET'])
@login_required
def money_transfers_by_category(category_id):
    category = Category.query.filter_by(id=category_id).first()
    if not category:
        return jsonify({"error": "Category not found"}), 404
    
    tags = Tag.query.filter_by(category_id=category.id).all()
    
    if not tags:
        return jsonify({"message": "No tags associated with this category"}), 200

    money_transfers = (
        MoneyTransfer.query
        .join(Tag, MoneyTransfer.id == Tag.money_transfer_id)
        .filter(
            Tag.category_id == category.id,
            MoneyTransfer.wallet_id == current_user.last_visited_wallet_id
        )
        .all()
    )
    return collect_tags_from(money_transfers)

@app.route("/remove_money/<int:id>", methods=['DELETE'])
def remove_money(id):
    money_to_delete = MoneyTransfer.query.get_or_404(id)
    Tag.query.filter_by(money_transfer_id=money_to_delete.id).delete()
    return remove_data(money_to_delete, "MoneyTransfer")

@app.route("/money_transfer_from/<string:start_date>/to/<string:end_date>")
@login_required
def money_transfers_by_date(start_date, end_date):
    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()

    transfers = MoneyTransfer.query.filter(
        db.func.date(MoneyTransfer.created_at) >= start_date_obj,
        db.func.date(MoneyTransfer.created_at) <= end_date_obj,
        MoneyTransfer.wallet_id == current_user.last_visited_wallet_id
    ).all()
    return collect_tags_from(transfers)

@app.route("/money_transfers/<int:year>/<int:month>", methods=['POST'])
def money_transfers_by_month(year, month):
    data = request.get_json()
    client_time_zone = data.get('timeZone', 'SYSTEM') 
    transfers = (
        db.session.query(
            db.func.convert_tz(MoneyTransfer.created_at, '+00:00', client_time_zone).label('local_created_at'),
            db.func.sum(MoneyTransfer.amount).label('total_amount')
        )
        .filter(db.extract('year', MoneyTransfer.created_at) == year)
        .filter(db.extract('month', MoneyTransfer.created_at) == month)
        .filter(MoneyTransfer.wallet_id == current_user.last_visited_wallet_id)
        .group_by(db.func.convert_tz(MoneyTransfer.created_at, '+00:00', client_time_zone))
        .all()
    )

    days = [
        {
            'day': transfer.local_created_at.day,  # Extraer el día del mes
            'total_amount': transfer.total_amount
        }
        for transfer in transfers
    ]
    total_amount_for_month = sum(transfer['total_amount'] for transfer in days)

    result = {
        'month': month,
        'year': year,
        'total_amount': total_amount_for_month,
        'days': days
    }
    return jsonify(result)
# ----- USER INTERFACE -----

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def set_user_wallets(user):
    all_wallets = Wallet.query.all()
    if len(all_wallets) == 0:
        raise Exception("no wallets available")
    user.wallets.extend(all_wallets)
    user.last_visited_wallet_id = all_wallets[0].id
    
@app.route("/google_login")
def google_login():
    if not google.authorized:
        return redirect(url_for("google.login"))
    # Cambia la solicitud a la URL completa
    resp = google.get("https://www.googleapis.com/oauth2/v1/userinfo")
    assert resp.ok, resp.text
    user_info = resp.json()
    username = user_info['name']
    email = user_info['email']
    picture = user_info['picture']

    user = User.query.filter_by(email=email).first()
    
    if not user:
        user = User(username=username,email=email, picture=picture)
        set_user_wallets(user)
        db.session.add(user)
    else:
        user.username = username
        user.picture = picture
    db.session.commit()

    login_user(user)
    return redirect(url_for("index"))

@app.route('/update_last_visited_wallet', methods=['POST'])
@login_required
def update_last_visited_wallet():
    data = request.get_json()
    wallet_id = data.get('wallet_id')

    if not wallet_id:
        return jsonify({"error": "Wallet ID is required"}), 400

    current_user.last_visited_wallet_id = wallet_id
    db.session.commit()

    return jsonify({"message": "Last group updated successfully"}), 200

@app.route("/profile")
@login_required
def profile():
    return f"Hola, {current_user.username}! <br> Tu correo es: {current_user.email} <br> <img src='{current_user.picture}' alt='Profile Picture'>"

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))

@app.route("/")
def index():
    if current_user.is_authenticated:
        return render_template("index.html", user=current_user, is_authenticated=current_user.is_authenticated)
    return redirect('google_login')

@app.route("/privacy")
def privacy():
    return render_template("privacy.html")

@app.route("/terms")
def terms():
    return render_template("terms.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(3000), debug = True )