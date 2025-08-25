require('dotenv').config({ path: '../../.env' }); 

class AIController {
  /**
   * POST /api/ai/gemini - Chat với AI sử dụng Gemini
   */
  static async chatWithGemini(req, res) {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Tin nhắn là bắt buộc'
        });
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Cấu hình API Key không hợp lệ'
        });
      }

      // Gọi Gemini API
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: message
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        console.error('Gemini API Error:', response.status, response.statusText);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi gọi AI service'
        });
      }

      const data = await response.json();
      
      // Kiểm tra response structure
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({
          success: true,
          data: {
            content: aiResponse,
            timestamp: new Date().toISOString()
          },
          message: 'Phản hồi từ AI thành công'
        });
      } else {
        console.error('Unexpected Gemini response structure:', data);
        return res.status(500).json({
          success: false,
          message: 'Phản hồi từ AI không hợp lệ'
        });
      }

    } catch (error) {
      console.error('Error in chatWithGemini:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý yêu cầu AI'
      });
    }
  }
}

module.exports = AIController;
