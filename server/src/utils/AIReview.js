const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyAQ5PNzmFcr1OeF1fC82Fj8sKb8twCEba0');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const product = require('../models/products.model'); // Model Sequelize của bạn

// Mapping mục đích sử dụng từ modal
const purposeMapping = {
    gaming: {
        name: 'Chơi Game',
        description: 'Game AAA, FPS cao, streaming',
        requirements: {
            cpu: 'Intel i5/i7 gen 10+ hoặc AMD Ryzen 5/7',
            gpu: 'GPU rời RTX 3060/4060+ hoặc RX 6600+',
            ram: 'RAM 16GB DDR4/DDR5',
            storage: 'SSD NVMe 512GB+',
            display: 'Màn hình 120Hz+, độ trễ thấp',
            cooling: 'Hệ thống tản nhiệt mạnh',
        },
        priorities: ['GPU hiệu năng cao', 'CPU mạnh', 'RAM đủ lớn', 'Tản nhiệt tốt', 'Màn hình cao tần số'],
    },
    office: {
        name: 'Văn Phòng',
        description: 'Word, Excel, PowerPoint, Email',
        requirements: {
            cpu: 'Intel i3/i5 hoặc AMD Ryzen 3/5',
            gpu: 'GPU tích hợp đã đủ',
            ram: 'RAM 8-16GB',
            storage: 'SSD 256GB+',
            display: 'Màn hình Full HD, chống chói',
            battery: 'Pin 6-8 tiếng sử dụng',
        },
        priorities: ['Thời lượng pin', 'Trọng lượng nhẹ', 'Giá cả hợp lý', 'Độ bền', 'Màn hình rõ nét'],
    },
    design: {
        name: 'Thiết Kế Đồ Họa',
        description: 'Photoshop, Illustrator, Figma',
        requirements: {
            cpu: 'Intel i7/i9 hoặc AMD Ryzen 7/9',
            gpu: 'GPU rời RTX 3070+ hoặc RX 6700XT+',
            ram: 'RAM 16-32GB',
            storage: 'SSD NVMe 1TB+',
            display: 'Màn hình 4K hoặc 2K, độ chính xác màu cao',
            color: '100% sRGB, Adobe RGB',
        },
        priorities: ['Chất lượng màn hình', 'GPU mạnh', 'RAM lớn', 'CPU đa nhân', 'Không gian lưu trữ'],
    },
    video: {
        name: 'Dựng Video',
        description: 'Premiere, After Effects, DaVinci',
        requirements: {
            cpu: 'Intel i7/i9 hoặc AMD Ryzen 7/9',
            gpu: 'GPU rời RTX 4070+ với VRAM 12GB+',
            ram: 'RAM 32GB+ DDR4/DDR5',
            storage: 'SSD NVMe 1TB+ tốc độ cao',
            display: 'Màn hình 4K, độ chính xác màu cao',
            cooling: 'Tản nhiệt mạnh cho workload nặng',
        },
        priorities: ['CPU đa nhân mạnh', 'RAM siêu lớn', 'GPU VRAM cao', 'SSD tốc độ cao', 'Tản nhiệt xuất sắc'],
    },
    coding: {
        name: 'Lập Trình',
        description: 'VS Code, Database, Server',
        requirements: {
            cpu: 'Intel i5/i7 hoặc AMD Ryzen 5/7',
            gpu: 'GPU tích hợp đủ dùng',
            ram: 'RAM 16GB+',
            storage: 'SSD NVMe 512GB+',
            display: 'Màn hình Full HD+, không nhấp nháy',
            keyboard: 'Bàn phím tốt, gõ êm',
        },
        priorities: ['CPU ổn định', 'RAM đủ lớn', 'SSD nhanh', 'Màn hình không mỏi mắt', 'Bàn phím chất lượng'],
    },
    student: {
        name: 'Học Tập',
        description: 'Nghiên cứu, học online, giải trí',
        requirements: {
            cpu: 'Intel i3/i5 hoặc AMD Ryzen 3/5',
            gpu: 'GPU tích hợp',
            ram: 'RAM 8-16GB',
            storage: 'SSD 256-512GB',
            display: 'Màn hình Full HD, bảo vệ mắt',
            battery: 'Pin 6-10 tiếng',
        },
        priorities: ['Giá cả phải chăng', 'Pin lâu', 'Trọng lượng nhẹ', 'Độ bền tốt', 'Đa tác vụ cơ bản'],
    },
};

// Hàm phân tích sản phẩm theo mục đích từ modal
async function analyzeProductForPurpose(reviewData) {
    try {
        const { purpose, productId } = reviewData;

        console.log(reviewData);

        // Tìm sản phẩm trong database
        const productData = await product.findOne({ where: { id: productId } });

        if (!productData) {
            throw new Error('Sản phẩm không tồn tại');
        }

        // Lấy thông tin mục đích sử dụng
        const purposeInfo = purposeMapping[purpose];
        if (!purposeInfo) {
            throw new Error('Mục đích sử dụng không hợp lệ');
        }

        // Tạo HTML cho sản phẩm cần phân tích
        const productHTML = `
            <div style="border: 2px solid #007bff; padding: 16px; margin: 12px 0; border-radius: 12px; background: linear-gradient(135deg, #f8f9ff, #e8f0ff);">
                ${
                    productData.imagesProduct && productData.imagesProduct[0]
                        ? `<img src="http://localhost:3000/uploads/products/${productData.imagesProduct.split(',')[0]}" 
                           alt="${productData.nameProduct}" 
                           style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; float: left; margin-right: 16px;">`
                        : ''
                }
                <div>
                    <h2 style="color: #007bff; font-size: 18px; margin-bottom: 8px;">${productData.nameProduct}</h2>
                    <p style="color: #28a745; font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                        💰 Giá: ${Number(productData.priceProduct).toLocaleString('vi-VN')} VND
                        ${
                            productData.discountProduct > 0
                                ? `<span style="color: #dc3545; margin-left: 8px;">(-${productData.discountProduct}%)</span>`
                                : ''
                        }
                    </p>
                    <p style="color: #6c757d; margin-bottom: 8px;"><strong>Danh mục:</strong> ${
                        productData.categoryProduct
                    }</p>
                    <p style="color: #6c757d; margin-bottom: 8px;"><strong>Tồn kho:</strong> ${
                        productData.stockProduct
                    } sản phẩm</p>
                    <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 6px;">
                        <strong style="color: #495057;">📝 Mô tả:</strong>
                        <p style="color: #6c757d; margin-top: 4px; line-height: 1.5;">${
                            productData.descriptionProduct
                        }</p>
                    </div>
                    ${
                        productData.specsProduct
                            ? `
                        <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 6px;">
                            <strong style="color: #495057;">⚙️ Thông số kỹ thuật:</strong>
                            <div style="margin-top: 8px; color: #6c757d;">
                                ${Object.entries(productData.specsProduct)
                                    .map(
                                        ([key, value]) =>
                                            `<p style="margin: 4px 0;"><strong>${key}:</strong> ${value}</p>`,
                                    )
                                    .join('')}
                            </div>
                        </div>
                    `
                            : ''
                    }
                </div>
                <div style="clear: both;"></div>
            </div>
        `;

        // Tạo prompt phân tích chuyên sâu
        const prompt = `
        🤖 BẠN LÀ CHUYÊN GIA Tư VẤN LAPTOP CHUYÊN NGHIỆP!

        📋 THÔNG TIN PHÂN TÍCH:
        • Mục đích sử dụng: ${purposeInfo.name} (${purposeInfo.description})
        • Yêu cầu kỹ thuật cho ${purposeInfo.name}:
          ${Object.entries(purposeInfo.requirements)
              .map(([key, value]) => `- ${key.toUpperCase()}: ${value}`)
              .join('\n  ')}
        • Ưu tiên đánh giá: ${purposeInfo.priorities.join(', ')}

        🔍 SẢN PHẨM CẦN PHÂN TÍCH:
        ${productHTML}

        📊 YÊU CẦU PHÂN TÍCH CHI TIẾT:
        Hãy phân tích sản phẩm này cho mục đích "${purposeInfo.name}" và trả về kết quả HTML bao gồm:

        1. 🎯 TỔNG QUAN & ĐIỂM SỐ (1-10):
           - Điểm tổng thể cho mục đích ${purposeInfo.name}
           - Lý do chấm điểm

        2. ✅ ĐIỂM MẠNH:
           - Những ưu điểm nổi bật phù hợp với ${purposeInfo.name}
           - So sánh với yêu cầu kỹ thuật

        3. ❌ ĐIỂM YẾU & HẠN CHẾ:
           - Những điểm chưa tốt hoặc thiếu sót
           - Ảnh hưởng đến việc sử dụng cho ${purposeInfo.name}

        4. 💡 ĐÁNH GIÁ CHI TIẾT:
           - CPU: Phù hợp mức độ nào?
           - GPU: Có đủ mạnh không?
           - RAM: Đủ để chạy tốt không?
           - Lưu trữ: SSD/HDD, dung lượng có ổn?
           - Màn hình: Chất lượng cho mục đích sử dụng
           - Pin & Tản nhiệt: Đánh giá

        5. 🎮 HIỆU NĂNG DỰ ĐOÁN:
           - Chạy các ứng dụng ${purposeInfo.description} như thế nào?
           - FPS game (nếu gaming), tốc độ render (nếu design/video)

        6. 💰 GIÁ TRỊ & SO SÁNH:
           - Có đáng đồng tiền không?
           - So với các sản phẩm cùng tầm giá

        7. 🔮 KẾT LUẬN & KHUYẾN NGHỊ:
           - Có nên mua cho mục đích ${purposeInfo.name} không?
           - Ai phù hợp với sản phẩm này?
           - Lời khuyên cuối cùng

        ⚠️ QUAN TRỌNG:
        - Phân tích KHÁCH QUAN, CHÍNH XÁC
        - Dựa trên thông số kỹ thuật thực tế
        - Trả về HTML đẹp mắt, dễ đọc với màu sắc và icon
        - Không bịa đặt thông tin không có
        - Ngôn ngữ thân thiện, chuyên nghiệp
        `;

        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        return {
            success: true,
            analysis: analysis.replace(/```(html|plaintext)?\n?/g, '').trim(),
            purpose: purposeInfo.name,
            productName: productData.nameProduct,
            productId: productId,
        };
    } catch (error) {
        console.error('Lỗi khi phân tích sản phẩm:', error);
        return {
            success: false,
            error: error.message,
            analysis: `
                <div style="padding: 20px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; color: #c53030;">
                    <h3 style="color: #c53030; margin-bottom: 10px;">❌ Lỗi phân tích</h3>
                    <p>Xin lỗi, hiện tại không thể phân tích sản phẩm này. Vui lòng thử lại sau!</p>
                    <p style="font-size: 12px; color: #a0a0a0;">Lỗi: ${error.message}</p>
                </div>
            `,
        };
    }
}

module.exports = {
    analyzeProductForPurpose, // Hàm mới cho modal AI review
};
