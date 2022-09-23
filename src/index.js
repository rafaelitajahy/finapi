const express = require('express');
const { v4: uuidv4 } = require('uuid')

const app = express();

app.use(express.json());

const customers = [];

app.post('/account', (req, resp) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return resp.status(400).json({ error: "Customer already Exists!" })
    }

    const id = uuidv4();

    customers.push({
        cpf,
        name,
        id,
        statement: []
    });

    return resp.status(201).send()
});

app.get('/statement/:cpf', (req, resp) => {
    const { cpf } = req.params;

    const customer = customers.find(customer => customer.cpf === cpf);

    return resp.json(customer.statement);
})

app.listen(3333);