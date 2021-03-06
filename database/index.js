
// const {username, password, host} = require('../config')
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const bcrypt    = require('bcrypt');
const username = process.env.MASTER_USER || "root";
const password = process.env.DB_PASSWORD || "";
const host = process.env.HOST|| "localhost";
const port = process.env.DB_PORT || '3306'
const dbName = process.env.DB_NAME || 'leadthedeal'

const sequelize = new Sequelize(dbName, username, password, {
  host: host,
  port: port,
  dialect: 'mysql'
});

///////////////////
/////MODELS ////////
///////////////////

//TODO: add maybe short description field of who the person is? Upon Registration

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: Sequelize.STRING,
  company: Sequelize.STRING,
  email: Sequelize.STRING,
  points: {
    type: Sequelize.INTEGER,
    defaultValue: 10,
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  last_login: Sequelize.DATE,
  status: {
    type: Sequelize.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
    hooks: {
      beforeCreate: (user) => {
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(user.password, salt);
      }
    }
})


User.prototype.isValidPassword = function(password){
  const isValid = bcrypt.compare(password, this.password)
  return isValid
}

//TODO: veryify isEmail true, maybe is Phone number true (sequelize docs)


const Contact = sequelize.define('contact', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: Sequelize.STRING,
  position: Sequelize.STRING,
  company: Sequelize.STRING,
  industry: Sequelize.STRING,
  phone: Sequelize.STRING,
  email: Sequelize.STRING,
  Address: Sequelize.STRING,
  verified: Sequelize.BOOLEAN,
  times_purchased: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  }
})

const Purchase = sequelize.define('purchase', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  }
})

const Comment = sequelize.define('comment', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  us: Sequelize.INTEGER,
  contactId: Sequelize.INTEGER,
  comment: Sequelize.STRING,
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.fn('NOW')
  }
})

//////////////////////
/////RELATIONSHIPS////
//////////////////////

User.hasMany(Contact, {as: 'Uploads'});
Contact.belongsTo(User);
User.belongsToMany(Contact, {as: 'Contacts', through: {model: Purchase, unique: false}, foreignKey: 'userId'});
Contact.belongsToMany(User, {as: 'Users', through: {model: Purchase, unique: false}, foreignKey: 'contactId'});
Purchase.belongsTo(User);
Purchase.belongsTo(Contact);
Contact.hasMany(Purchase);
User.hasMany(Purchase);



///////////////////////////////////////////
/////////////HELPER FUNCTIONS//////////////
//////////////////////////////////////////


const purchasedContacts = function (callback, id) {
  Purchase.findAll({
    where: {
      userId: id
    }
  })
    .then((contacts) => {    
      return contacts.map((contact) => contact.contactId)
    })
      .then((contactIds)=>{
        return Contact.findAll({
          where:{
            id: contactIds
          }
        })
      })
      .then((purchased)=>{
        return callback(purchased)
      })
    .catch((err) => {
      console.log(err)
    })
}

const getPurchasedContacts = (userId) => {
  return Purchase.findAll({
    where: {
      userId: userId
    },
    include: [
      {model: Contact}
    ]
  }).then((result) => {
      return result.map(model => {
        model.contact.dataValues.status = model.status;
        return model.contact;
      })
  }).catch((err) => {
    return err;
  });
}


////////////////////
///// EXPORTS //////
////////////////////

module.exports.sequelize = sequelize;
module.exports.User = User;
module.exports.Contact = Contact;
module.exports.Purchase = Purchase;
module.exports.purchasedContacts = purchasedContacts;
module.exports.Comment = Comment;
module.exports.getPurchasedContacts = getPurchasedContacts;

