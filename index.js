const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);

// middle ware
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cardoctors.ppdajwi.mongodb.net/?retryWrites=true&w=majority&appName=CarDoctors`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// create own// middlewares

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const carDoctorsCollection = client
      .db('CarDoctorsDB')
      .collection('Services');

    const bookingCollection = client.db('CarDoctorsDB').collection('Bookings');

    // auth related api jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });

      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // get one services by id
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, service_id: 1, price: 1, img: 1 },
      };
      const service = await carDoctorsCollection.findOne(query, options);
      res.send(service);
    });

    // get all services
    app.get('/services', async (req, res) => {
      const cursor = carDoctorsCollection.find();
      const services = await cursor.toArray();
      res.send(services);
    });

    // bookings api
    // http://localhost:5000/bookings?email=${user.email}

    // get all data for specific user from db

    app.get('/bookings', verifyToken, async (req, res) => {
      // console.log(req.query.email);
      // console.log(req.user.email);

      // console.log('ttttt token', req.cookies.token) for jwt
      // console.log('user in the valid token', req.user);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      // for get specific order booking
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // post data for booking or send data to server
    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // update method

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const updateBooking = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: updateBooking.status,
        },
      };

      const result = await bookingCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // delete data from db

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Car Doctors Server is Running');
});

app.listen(port, () => {
  console.log(`Car Doctor Is Running In Port : ${port}`);
});
