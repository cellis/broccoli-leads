
const path = require('path');
const fs = require('fs');

// note: client is an instance of node-pg Client
exports.up = async (client, transform) => {
  const filePath = path.join(__dirname, 'sqls','20251217073232-broccoli-schema-up.sql');
  
  let script = await fs.promises.readFile(filePath, { encoding: 'utf-8' });

  if (transform) {
    script = await transform(script);
  }

  console.log('[nomadic]:', 'migrating up', '20251217073232-broccoli-schema');

  console.log(script);

  return client.query(script);
};

exports.down = async (client, transform) => {
  const filePath = path.join(__dirname, 'sqls','20251217073232-broccoli-schema-down.sql');
  let script = await fs.promises.readFile(filePath, { encoding: 'utf-8' });

  if (transform) {
    script = await transform(script);
  }

  console.log('[nomadic]:', 'migrating down', '20251217073232-broccoli-schema');

  console.log(script);

  return client.query(script);
};
