#!/bin/bash

# Test script to verify image serving is working correctly

echo "🧪 Testing Payment Proof Image Serving"
echo "========================================"
echo ""

# Check if backend is running
echo "1. Checking if backend is running on port 5000..."
if curl -s http://localhost:5000/api > /dev/null; then
    echo "   ✓ Backend is running"
else
    echo "   ✗ Backend is not running. Please start it first with: npm run dev"
    exit 1
fi

echo ""
echo "2. Checking uploads directory structure..."
if [ -d "uploads/proofs" ]; then
    echo "   ✓ uploads/proofs directory exists"
    file_count=$(find uploads/proofs -name "proof-*.png" -o -name "proof-*.jpg" -o -name "proof-*.jpeg" -o -name "proof-*.webp" 2>/dev/null | wc -l)
    echo "   Found $file_count proof image(s)"
    
    if [ $file_count -gt 0 ]; then
        echo ""
        echo "3. Testing image accessibility..."
        # Get the first proof file
        first_file=$(find uploads/proofs -name "proof-*" -type f | head -n 1)
        if [ -n "$first_file" ]; then
            filename=$(basename "$first_file")
            url="http://localhost:5000/uploads/proofs/$filename"
            echo "   Testing URL: $url"
            
            response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
            if [ "$response" = "200" ]; then
                echo "   ✓ Image is accessible (HTTP 200)"
            else
                echo "   ✗ Image returned HTTP $response"
            fi
        fi
    fi
else
    echo "   ⚠ uploads/proofs directory does not exist yet"
    echo "   This is normal if no payment proofs have been uploaded"
fi

echo ""
echo "4. Next steps:"
echo "   - Run the migration: node fix-payment-proof-urls.js"
echo "   - Refresh the admin approvals page"
echo "   - Screenshots should now display correctly"
echo ""
