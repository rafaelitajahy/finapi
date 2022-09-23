const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(req, resp, next) {
  const { cpf } = req.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return resp.status(400).json({ error: 'Customer not found' });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post('/account', (req, resp) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return resp.status(400).json({ error: 'Customer already Exists!' });
  }

  const id = uuidv4();

  customers.push({
    cpf,
    name,
    id,
    statement: [],
  });

  return resp.status(201).send();
});

//app.use(verifyIfExistsAccountCPF);

app.get('/statement', verifyIfExistsAccountCPF, (req, resp) => {
  const { customer } = req;

  return resp.json(customer.statement);
});

app.post('/deposit', verifyIfExistsAccountCPF, (req, resp) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return resp.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCPF, (req, resp) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    create_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return resp.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCPF, (req, resp) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + ' 00:00');

  console.log(dateFormat, date);
  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return resp.json(statement);
});

app.put('/account', verifyIfExistsAccountCPF, (req, resp) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return resp.status(201).send();
});

app.get('/account', verifyIfExistsAccountCPF, (req, resp) => {
  const { name, cpf } = req.customer;

  return resp.status(200).json({ name, cpf });
});

app.delete('/account', verifyIfExistsAccountCPF, (req, resp) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return resp.status(204);
});

app.get('/account/list', (req, resp) => {
  const newCustomers = [];

  customers.map((customer) => {
    const { name, cpf } = customer;

    newCustomers.push({ name, cpf });
  });

  return resp.status(200).json(newCustomers);
});

app.get('/balance', verifyIfExistsAccountCPF, (req, resp) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return resp.json(balance);
});

app.listen(3333);
