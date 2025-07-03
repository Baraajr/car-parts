const supertest = require('supertest');
const app = require('../../app');

let adminToken;
let categoryId;
let userToken;
let product;

beforeEach(async () => {
  const adminUser = await createAdminUser();
  adminToken = createJWTToken(adminUser._id);

  const category = await createCategory();
  categoryId = category._id;
});

describe('Testing Products routes ', () => {
  describe('/api/v1/products', () => {
    describe('GET', () => {
      it('should return an array of products', async () => {
        const response = await supertest(app).get('/api/v1/products');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBeTruthy();
      });
    });

    describe('GET with pagination', () => {
      it('should return paginated products', async () => {
        const response = await supertest(app).get(
          '/api/v1/products?page=1&limit=5',
        );
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body).toHaveProperty('paginationResult');
        expect(response.body.paginationResult).toHaveProperty('currentPage', 1);
        expect(response.body.paginationResult).toHaveProperty('limit', 5);
        expect(response.body.paginationResult).toHaveProperty('numberOfPages');
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app).post('/api/v1/products').send({
            name: 'Test Product 2',
            price: 200,
            description: 'Test product description 2',
            category: categoryId,
            quantity: 5,
          });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });

      describe('with regular user token', () => {
        it('Should returns 403 Forbidden', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);

          const response = await supertest(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Test Product 2',
              price: 200,
              description: 'Test product description 2',
              category: categoryId,
              quantity: 5,
            });

          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with Admin token', () => {
        describe('with all required fields', () => {
          it('should Return 201 Created', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
              });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('name', 'Test Product 2');
            expect(response.body.data).toHaveProperty('price', 200);
          });
        });

        describe('with missing name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                price: 200,
                description: 'Test product description 2',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Product name is required');
          });
        });

        describe('with missing quantiy', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product quantity is required',
            );
          });
        });

        describe('with missing price', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                description: 'Test product description 2',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product price is required',
            );
          });
        });

        describe('with missing description', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product description is required',
            );
          });
        });

        describe('with missing category', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product must belong to a category',
            );
          });
        });

        describe('with invalid category', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: 'invalidCategoryId',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Invalid category ID format',
            );
          });
        });

        describe('with non exsiting category', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: '646f3b0c4d5e8a3d4c8b4567',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'No category for this id: 646f3b0c4d5e8a3d4c8b4567',
            );
          });
        });

        describe('with invalid price', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 'invalidPrice',
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product price must be a number',
            );
          });
        });

        describe('with negative price', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: -200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product price must be greater than or equal to 0',
            );
          });
        });

        describe('with invalid quantity', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 'invalidQuantity',
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'quantity must be a number',
            );
          });
        });

        describe('with negative quantity', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: -5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product quantity must be greater than or equal to 0',
            );
          });
        });

        describe('with non-integer quantity', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5.5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product quantity must be an integer',
            );
          });
        });

        describe('non-existing brand', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
                brand: '646f3b0c4d5e8a3d4c8b4567',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'No brand with this id 646f3b0c4d5e8a3d4c8b4567',
            );
          });
        });

        describe('with invalid brand', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
                brand: 'invalidBrandId',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Invalid brand ID format');
          });
        });

        describe('with non-existing subcategory', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
                subcategories: ['646f3b0c4d5e8a3d4c8b4567'],
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(
              'One or more subcategory IDs do not exist',
            );
          });
        });

        describe('with invalid subcategory', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
                subcategories: ['invalidSubcategoryId'],
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(
              'One or more subcategory IDs are invalid.',
            );
          });
        });
      });
    });
  });

  describe('/api/v1/products/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        it('should return a single product', async () => {
          product = await createProduct(categoryId);
          const response = await supertest(app).get(
            `/api/v1/products/${product._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'Test Product');
        });
      });
      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app).get(
            '/api/v1/products/invalidId',
          );
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid product ID format');
        });
      });
      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/products/646f3b0c4d5e8a3d4c8b4567',
          );
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No Document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });
    });

    describe('PATCH', () => {
      describe('with valid id', () => {
        it('should update the product', async () => {
          product = await createProduct(categoryId);

          const response = await supertest(app)
            .patch(`/api/v1/products/${product._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'Updated Product');
          expect(response.body.data).toHaveProperty('price', 300);
          expect(response.body.data).toHaveProperty(
            'description',
            'Updated product description',
          );

          expect(response.body.data).toHaveProperty('quantity', 10);
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/products/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid product ID format');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/products/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with invalid category', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch(`/api/v1/products/${product._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: 'invalidCategoryId',
              quantity: 10,
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toContain('Invalid category ID format');
        });
      });

      describe('with non-existing category', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch(`/api/v1/products/${product._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: '646f3b0c4d5e8a3d4c8b4567',
              quantity: 10,
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toContain('No category for this id');
        });
      });

      describe('with regular user token', () => {
        it('should return 403 Forbidden', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);

          const response = await supertest(app)
            .patch(`/api/v1/products/${product._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app)
            .patch(`/api/v1/products/${product._id}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });

    describe('DELETE', () => {
      describe('with valid id', () => {
        it('should delete the product', async () => {
          product = await createProduct(categoryId);
          const response = await supertest(app)
            .delete(`/api/v1/products/${product._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/products/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid product ID format');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/products/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with regular user token', () => {
        it('should return 403 Forbidden', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);

          const response = await supertest(app)
            .delete(`/api/v1/products/${product._id}`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app).delete(
            `/api/v1/products/${product._id}`,
          );
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });
  });

  describe('get /api/v1/products/search', () => {
    describe('with valid search text', () => {
      it('should return an array of products', async () => {
        await createProduct(categoryId);
        const response = await supertest(app)
          .get('/api/v1/products/search')
          .send({ text: 'Test' });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.products)).toBeTruthy();
      });
    });

    describe('with empty search text', () => {
      it('should return 400 Bad Request', async () => {
        const response = await supertest(app)
          .get('/api/v1/products/search')
          .send({ text: '' });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Search text is required');
      });
    });
  });

  describe('get /api/v1/products/:id/reviews', () => {
    describe('Get', () => {
      it('should return 200 OK', async () => {
        product = await createProduct(categoryId);
        const response = await supertest(app).get(
          `/api/v1/products/${product._id}/reviews`,
        );
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(Array.isArray(response.body.data)).toBeTruthy();
      });
    });
    describe('with invalid id', () => {
      it('should return 400 Bad Request', async () => {
        const response = await supertest(app).get(
          '/api/v1/products/invalidId/reviews',
        );
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid product ID format');
      });
    });

    describe('with non-existing id', () => {
      it('should return 404 Not Found', async () => {
        const response = await supertest(app).get(
          '/api/v1/products/646f3b0c4d5e8a3d4c8b4567/reviews',
        );
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(
          'No product with this id 646f3b0c4d5e8a3d4c8b4567',
        );
      });
    });
  });

  describe('post /api/v1/products/:id/reviews', () => {
    describe('Post', () => {
      describe('with user token', () => {
        it('should return 201 Created', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);

          product = await createProduct(categoryId);
          const response = await supertest(app)
            .post(`/api/v1/products/${product._id}/reviews`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              title: 'Great product!',
              ratings: 4.5,
            });

          expect(response.status).toBe(201);
          expect(response.body.status).toBe('success');
          expect(response.body.data.title).toBe('Great product!');
          expect(response.body.data.ratings).toBe(4.5);
          expect(response.body.data.product.toString()).toBe(
            product._id.toString(),
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          product = await createProduct(categoryId);
          const response = await supertest(app).post(
            `/api/v1/products/${product._id}/reviews`,
          );
          // expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });
  });
});
