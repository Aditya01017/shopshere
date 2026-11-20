const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const fs = require('fs/promises');

const readProductFields = (body) => {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  if (!name || name.length > 150 || !description || description.length > 3000
    || !category || category.length > 100 || !Number.isFinite(price) || price < 0 || price > 1000000
    || !Number.isInteger(stock) || stock < 0 || stock > 1000000) return null;
  return { name, description, category, price, stock };
};

const uploadImage = async (file) => {
  if (!file) return null;
  try {
    return await cloudinary.uploader.upload(file.path, { folder: 'shopshere/products', resource_type: 'image' });
  } finally {
    await fs.unlink(file.path).catch((error) => {
      if (error.code !== 'ENOENT') console.error('Temporary image cleanup failed:', error.message);
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message: 'Invalid product id.' });
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const fields = readProductFields(req.body);
    if (!fields || !req.file) return res.status(400).json({ message: 'Provide valid product details and an image.' });
    const result = await uploadImage(req.file);
    if (!result?.secure_url) return res.status(502).json({ message: 'Unable to upload the product image.' });
    const product = new Product({
      ...fields,
      imageUrl: result.secure_url,
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Product details are invalid.' });
    console.error('Product creation failed:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message: 'Invalid product id.' });
    const product = await Product.findById(req.params.id);
    if (product) {
      const fields = readProductFields({
        name: req.body?.name ?? product.name,
        description: req.body?.description ?? product.description,
        price: req.body?.price ?? product.price,
        category: req.body?.category ?? product.category,
        stock: req.body?.stock ?? product.stock,
      });
      if (!fields) return res.status(400).json({ message: 'Product details are invalid.' });
      Object.assign(product, fields);
      if (req.file) {
        const result = await uploadImage(req.file);
        if (!result?.secure_url) return res.status(502).json({ message: 'Unable to upload the product image.' });
        product.imageUrl = result.secure_url;
      }
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Product details are invalid.' });
    console.error('Product update failed:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message: 'Invalid product id.' });
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
