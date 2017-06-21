###Run project
**Without Migrations**

```
npm install
npm start
```

**With Migrations**

```
npm install
node_modules/.bin/sequelize db:migrate
npm start
```

###How to create similar project

####Express setup

```bash
# install express generator globally
npm install -g express-generator

# create the sample app
mkdir express-example
cd express-example
express -f

# install all node modules
npm install
```

####Sequelize setup

```bash
# install ORM , CLI and SQLite dialect
npm install --save sequelize sequelize-cli sqlite3

# generate models
node_modules/.bin/sequelize init
node_modules/.bin/sequelize model:create --name User --attributes username:string

# create migrations
node_modules/.bin/sequelize migration:create

# generate schema from models. Move resulted files to migrations folder
node generate-schema.js
```
