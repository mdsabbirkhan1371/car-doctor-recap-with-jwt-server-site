const { ObjectId } = require('mongodb');
const { client, app } = require('.');

async function run() {
  try {
    const carDoctorsCollection = client
      .db('CarDoctorsDB')
      .collection('Services');

    const bookingCollection = client.db('CarDoctorsDB').collection('Bookings');

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

    // booking service
    // get all data for specific user from db
    // post data for booking or send data to server
    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
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
exports.run = run;
