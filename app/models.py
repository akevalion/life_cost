from datetime import datetime
from flask_login import UserMixin
from .extensions import db

# ---------- ASSOCIATION TABLE ----------
user_wallet = db.Table(
    'user_wallet',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('wallet_id', db.Integer, db.ForeignKey('wallet.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

# ---------- MODELS ----------

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    picture = db.Column(db.String(300))
    last_visited_wallet_id = db.Column(db.Integer, db.ForeignKey('wallet.id'))

    wallets = db.relationship(
        "Wallet",
        secondary=user_wallet,
        back_populates="users"
    )

    def get_id(self):
        return str(self.id)


class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    description = db.Column(db.String(300))

    users = db.relationship(
        "User",
        secondary=user_wallet,
        back_populates="wallets"
    )


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category_parent = db.Column(db.Integer)
    number_of_operation = db.Column(db.Integer)


class MoneyTransfer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modifed_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, nullable=False)


class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    money_transfer_id = db.Column(db.Integer, db.ForeignKey('money_transfer.id'))

    category = db.relationship(
        'Category',
        backref=db.backref('tags', lazy=True)
    )

    money_transfer = db.relationship(
        'MoneyTransfer',
        backref=db.backref('tags', lazy=True)
    )
