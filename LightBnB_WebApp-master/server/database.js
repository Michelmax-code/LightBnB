const { Pool } = require('pg');  
const properties = require('./json/properties.json');
const users = require('./json/users.json');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const sql = `SELECT * FROM users WHERE email = $1`;
  return pool.query(sql,[email])
    .then(res => {
      return res.rows[0];
    })
    .catch(null)
}
exports.getUserWithEmail = getUserWithEmail;

// ORIGINAL FORMAT (first download)
// const getUserWithEmail = function(email) {
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   return Promise.resolve(user);
// }
// exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) => {
  const sqlQuery = `SELECT * FROM users WHERE id = $1`;
  return pool.query(sqlQuery,[id])
    .then(res => {
      return res.rows[0];
    })
    .catch(null)
}
exports.getUserWithId = getUserWithId;

// Original form downloaded
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }
// exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const sqlQuery = `INSERT INTO users (name, email, password) 
  VALUES ($1, $2, $3) 
  RETURNING *;
  `;
  const values = [user.name, user.email, user.password];
return pool.query(sqlQuery, values)
  .then(data => data.rows[0])
  .catch(null)
}
exports.addUser = addUser;

// Original downloaded file
// const addUser =  function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// }
// exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const sqlQuery = `
    SELECT reservations.*, properties.*, avg(rating) as average_rating
    FROM reservations 
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.start_date >= now()
    GROUP BY properties.id, reservations.id
    LIMIT $2
    `;
  return pool.query(sqlQuery, [guest_id, limit])
  .then(data => data.rows)
  .catch(null)
}
exports.getAllReservations = getAllReservations;

// Original download
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }
// exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city LIKE $${queryParams.length} \n`;
    }
    if(options.owner_id) {
      queryParams.push(`${options.owner_id}`)
      queryString += `AND owner_id = $${queryParams.length}\n`
    }
    if(options.minimum_price_per_night) {
      queryParams.push(options.minimum_price_per_night)
      queryString += `AND cost_per_night >= $${queryParams.length}\n`
    }
    if(options.maximum_price_per_night) {
      queryParams.push(options.maximum_price_per_night)
      queryString += `AND cost_per_night <= $${queryParams.length}\n`
    }
    queryString +=  `GROUP BY properties.id\n`

    if(options.minimum_rating) {
      queryParams.push(options.minimum_rating)
      queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}\n`
    }
    queryString +=  `ORDER BY cost_per_night\n`
    queryParams.push(limit);
    queryString += `
    LIMIT $${queryParams.length};
    `;
    return pool.query(queryString, queryParams)
    .then(res => res.rows);

  }

// Original download
// const getAllProperties = (options, limit = 10) => {
//   return pool
//   .query(`SELECT * FROM properties LIMIT $1`, [limit])
//   .then((result) => {
//     console.log(result.rows);
//     return result.rows;
//   })
//   .catch((err) => {
//     console.log(err.message);
//   });
// }; until this lane!


//  const getAllProperties = function(options, limit = 10) {
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// }
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
