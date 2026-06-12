# This project is licensed under the terms of the GPL v3.0 license. Copyright 2024 Cyteon

import os

import pymongo

client = pymongo.MongoClient(os.getenv("MONGODB_URL"))
db = client.potatobot
