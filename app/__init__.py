#!/usr/bin/env python3
# -*- encoding: utf-8 -*-
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# create app
app = Flask(__name__)
app.config.from_object('config')

# create db connection
db = SQLAlchemy(app)

# register blueprints
from app.dashboard.views import mod as mod_dashboard  # noqa: E402
app.register_blueprint(mod_dashboard)

from app.index.views import mod as mod_index  # noqa: E402
app.register_blueprint(mod_index)
