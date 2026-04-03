const Product = require('../models/Product');

const normalizeMediaUrls = (mediaUrls = []) => {
  const backendHost = process.env.BACKEND_URL || 'http://localhost:5000';
  return mediaUrls.map((url) =>
    typeof url === 'string' && url.startsWith('http://localhost:5000')
      ? url.replace('http://localhost:5000', backendHost)
      : url
  );
};

// -------------------------------------------------------
// @desc    Create a new product (with media upload)
// @route   POST /api/products
// @access  Private (admin only)
// -------------------------------------------------------
// -------------------------------------------------------
// @desc    Create a new product (with media upload)
// @route   POST /api/products
// @access  Private (admin only)
// -------------------------------------------------------
const createProduct = async (req, res) => {
  const { title, category, description, isActive } = req.body;

  // Validate required fields
  if (!title || !category) {
    return res.status(400).json({
      success: false,
      message: 'Title and category are required.',
    });
  }

  // Validate category enum
  const validCategories = ['invitation', 'envelope', 'box', 'reel'];
  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
    });
  }

  // Check that at least one file was uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one media file is required.',
    });
  }

  // Create URLs pointing to the local static uploads folder
  const mediaUrls = req.files.map((f) => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
  const mediaPublicIds = []; // No longer needed for local storage

  const product = await Product.create({
    title,
    category: category.toLowerCase(),
    description: description || '',
    mediaUrls,
    mediaPublicIds,
    isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
  });

  return res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    data: { product },
  });
};

// -------------------------------------------------------
// @desc    Get all products (optionally filter by category)
// @route   GET /api/products?category=invitation
// @access  Public
// -------------------------------------------------------
const getProducts = async (req, res) => {
  const { category, page = 1, limit = 20, admin } = req.query;

  const filter = admin === 'true' ? {} : { isActive: { $ne: false } };
  if (category) {
    const validCategories = ['invitation', 'envelope', 'box', 'reel'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }
    filter.category = category.toLowerCase();
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 }) // newest first
    .skip(skip)
    .limit(Number(limit));

  const normalizedProducts = products.map((product) => {
    const obj = product.toObject ? product.toObject() : { ...product };
    obj.mediaUrls = normalizeMediaUrls(obj.mediaUrls);
    return obj;
  });

  return res.status(200).json({
    success: true,
    data: {
      products: normalizedProducts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
};

// -------------------------------------------------------
// @desc    Get products by category (URL param)
// @route   GET /api/products/category/:category
// @access  Public
// -------------------------------------------------------
const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20, admin } = req.query;

  const validCategories = ['invitation', 'envelope', 'box', 'reel'];
  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
    });
  }

  const filter = { category: category.toLowerCase() };
  if (admin !== 'true') {
     filter.isActive = { $ne: false };
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const normalizedProducts = products.map((product) => {
    const obj = product.toObject ? product.toObject() : { ...product };
    obj.mediaUrls = normalizeMediaUrls(obj.mediaUrls);
    return obj;
  });

  return res.status(200).json({
    success: true,
    data: {
      category: category.toLowerCase(),
      products: normalizedProducts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
};

// -------------------------------------------------------
// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
// -------------------------------------------------------
const getProductById = async (req, res) => {
  const { admin } = req.query;
  const product = await Product.findById(req.params.id);

  if (!product || (product.isActive === false && admin !== 'true')) {
    return res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
  }

  const normalizedProduct = product.toObject ? product.toObject() : { ...product };
  normalizedProduct.mediaUrls = normalizeMediaUrls(normalizedProduct.mediaUrls);

  return res.status(200).json({
    success: true,
    data: { product: normalizedProduct },
  });
};

// -------------------------------------------------------
// @desc    Delete a product (hard delete)
// @route   DELETE /api/products/:id
// @access  Private (admin only)
// -------------------------------------------------------
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
  }

  // Hard delete the product
  await Product.findByIdAndDelete(req.params.id);

  return res.status(200).json({
    success: true,
    message: 'Product deleted successfully.',
  });
};

// -------------------------------------------------------
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (admin only)
// -------------------------------------------------------
const updateProduct = async (req, res) => {
  const { title, category, description, isActive } = req.body;
  
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
  }

  // Update fields if provided
  if (title) product.title = title;
  if (category) {
    const validCategories = ['invitation', 'envelope', 'box', 'reel'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }
    product.category = category.toLowerCase();
  }
  if (description !== undefined) product.description = description;
  if (isActive !== undefined) product.isActive = (isActive === 'true' || isActive === true);

  // Handle media updates
  if (req.body.mediaUrls) {
    // Use the provided mediaUrls array (for removing specific media)
    try {
      const updatedMediaUrls = JSON.parse(req.body.mediaUrls);
      product.mediaUrls = updatedMediaUrls;
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mediaUrls format.',
      });
    }
  }

  // Handle new media if uploaded
  if (req.files && req.files.length > 0) {
    const newMediaUrls = req.files.map((f) => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
    // Append new media to existing
    product.mediaUrls = [...product.mediaUrls, ...newMediaUrls];
  }

  // Validate that we have at least one media URL
  if (!product.mediaUrls || product.mediaUrls.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one media file is required.',
    });
  }

  await product.save();

  return res.status(200).json({
    success: true,
    message: 'Product updated successfully.',
    data: { product },
  });
};

module.exports = {
  createProduct,
  getProducts,
  getProductsByCategory,
  getProductById,
  deleteProduct,
  updateProduct,
};
