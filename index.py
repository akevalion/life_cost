from flask import Flask, render_template, url_for, request, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect
from datetime import datetime
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:123@localhost/life_db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    alias = db.Column(db.String(200), nullable=False)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category_parent = db.Column(db.Integer)
    number_of_operation = db.Column(db.Integer)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer)
    money_transfer_id = db.Column(db.Integer)

class MoneyTransfer(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    amount = db.Colum(db.Float, nullable = False)
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

# ----- END POINTS USERS -----
@app.route("/user/<int:id>", methods=['GET'])
def user(id):
    return to_json(User.query.get_or_404(id))

@app.route("/add_user", methods=['POST'])
def add_user():
    data = request.json
    new_user = User(name=data["name"], alias=data["alias"])
    return add_data(new_user, 'User')

def has_money_transfer(user):
    return False

@app.route("/remove_user/<int:id>", methods=['DELETE'])
def remove_user(id):
    user_to_delete = User.query.get_or_404(id)
    if has_money_transfer(user_to_delete):
        return jsonify({"message":"Not Allowed remove first money transfers"}), 405
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

def has_tags(category):
    return False

@app.route("/remove_category/<int:id>", methods=['DELETE'])
def remove_category(id):
    category_to_delete = Category.query.get_or_404(id)
    if has_tags(category_to_delete):
        return jsonify({"message":"Not Allowed remove first tags"}), 405
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

@app.route("/add_money", methods=['POST'])
def add_money():
    data = request.json
    new_money_transfer = MoneyTransfer(
        amount=data["amount"],
        description=data["description"],
        user_id=data["user_id"],
        created_at=data["created_at"],
        modifed_at=data["modifed_at"])
    return add_data(new_money_transfer, 'MoneyTransfer')

@app.route("/remove_money/<int:id>", methods=['DELETE'])
def remove_money(id):
    money_to_delete = MoneyTransfer.query.get_or_404(id)
    return remove_data(money_to_delete, "MoneyTransfer")
# ----- USER INTERFACE -----
@app.route("/")
def index():
    return "\"message\": \"Hola mundo loco!!\""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(3000), debug = True )