const supertest = require('supertest');
const app = require('../../app');

let user;
let token;
let addressId;

beforeEach(async () => {
  user = await createReqularUser();
  token = createJWTToken(user._id);
});

describe('Address Routes', () => {
  describe('/api/v1/addresses', () => {
    describe('GET /', () => {
      it('should return all addresses of the logged-in user', async () => {
        const response = await supertest(app)
          .get('/api/v1/addresses')
          .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveProperty('addresses');
      });
    });

    describe('POST /', () => {
      describe('with valid data', () => {
        it('should add a new address for the logged-in user', async () => {
          const newAddress = {
            alias: 'work',
            details: 'Egypt, menofiya, menouf, tamalay',
            phone: '01032650872',
            city: 'menouf',
            postalCode: '31734',
          };

          const response = await supertest(app)
            .post('/api/v1/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send(newAddress);

          addressId = response.body.data.address[0]._id;
          expect(response.statusCode).toBe(200);
          expect(response.body.data).toHaveProperty('address');
          expect(response.body.data.address).toEqual(
            expect.arrayContaining([expect.objectContaining(newAddress)]),
          );
        });
      });

      describe('with invalid data', () => {
        it('should return a validation error ', async () => {
          const newAddress = {};
          const response = await supertest(app)
            .post('/api/v1/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send(newAddress);
          expect(response.statusCode).toBe(400);
          expect(response.body).toHaveProperty('message');
          expect(response.body.message).toContain(
            'alias required, Please provide your address phone, Invalid phone number only accepted Egy and SA Phone numbers, Please provide your postal code, Please provide a valid postal code, please provide the city',
          );
        });
      });
    });

    describe('DELETE /:addressId', () => {
      it('should remove an address by ID', async () => {
        const response = await supertest(app)
          .delete(`/api/v1/addresses/${addressId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(204);
      });
    });
  });
});
