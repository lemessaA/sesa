import express from 'express';
import type { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

// Validation middleware
const validate = (req: any, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// @route   POST api/categories
// @desc    Create category (Admin only)
// @access  Private (Admin)
router.post(
    '/',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]),
    [
        body('name', 'Name is required').trim().notEmpty().escape(),
        body('description').optional().trim().escape(),
        body('icon').optional().trim()
    ],
    validate,
    async (req: any, res: Response) => {
        try {
            const { name, description, icon } = req.body;

            // Check if category already exists
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category already exists' });
            }

            const category = new Category({
                name,
                description,
                icon: icon || '📚',
                createdBy: (req as any).user.id
            });

            await category.save();
            res.status(201).json(category);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   GET api/categories
// @desc    Get all active categories
// @access  Public
router.get('/', async (req, res: Response) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res: Response) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/categories/:id
// @desc    Update category (Admin only)
// @access  Private (Admin)
router.put(
    '/:id',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]),
    [
        body('name').optional().trim().notEmpty().escape(),
        body('description').optional().trim().escape(),
        body('icon').optional().trim(),
        body('isActive').optional().isBoolean()
    ],
    validate,
    async (req: any, res: Response) => {
        try {
            const { name, description, icon, isActive } = req.body;
            const category = await Category.findById(req.params.id);

            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Check if new name already exists
            if (name && name !== category.name) {
                const existingCategory = await Category.findOne({ name });
                if (existingCategory) {
                    return res.status(400).json({ message: 'Category name already exists' });
                }
                category.name = name;
            }

            if (description !== undefined) category.description = description;
            if (icon !== undefined) category.icon = icon;
            if (isActive !== undefined) category.isActive = isActive;

            await category.save();
            res.json(category);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   DELETE api/categories/:id
// @desc    Delete category (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]), async (req: any, res: Response) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Soft delete - just mark as inactive
        category.isActive = false;
        await category.save();

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
