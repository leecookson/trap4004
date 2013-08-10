#!/bin/bash


#db.reportData.find({"boxContent.loot.1":{$gt:1000000}},{"boxContent.loot":1}).limit(5)

which mongo
mongo hobbitmobile-1 << MONGO
db.reportData.find({'boxContent.loot.2':{'$lt':1000}}).limit(5);

MONGO
