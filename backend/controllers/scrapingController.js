const { spawn } = require('child_process');
const path = require('path');

// Hàm chạy script Python
const runPythonScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    console.log(`Running Python script: ${scriptPath} with args: ${args.join(' ')}`);
    
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`Python stdout: ${output}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log(`Python stderr: ${output}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code: ${code}`);
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Python script exited with code ${code}. stderr: ${stderr}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`Error starting Python process: ${error.message}`);
      reject(error);
    });
  });
};

// API để chạy script fetch listing info
const runListingInfoScraping = async (req, res) => {
  try {
    const { locationName } = req.body;

    if (!locationName) {
      return res.status(400).json({
        success: false,
        message: 'Tên địa điểm là bắt buộc'
      });
    }

    // Đường dẫn tới script Python (relative từ backend folder)
    const scriptPath = path.join(__dirname, '..', '..', 'crawler', 'execute', 'run_fetch_listing_info.py');
    
    console.log(`Starting listing info scraping for location: ${locationName}`);
    
    // Chạy script Python với tham số locationName
    const result = await runPythonScript(scriptPath, [locationName]);
    
    res.json({
      success: true,
      message: `Thành công thu thập dữ liệu listing cho ${locationName}`,
      output: result.stdout,
      stderr: result.stderr
    });

  } catch (error) {
    console.error('Error in listing info scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thu thập dữ liệu listing',
      error: error.message
    });
  }
};

// API để chạy script fetch reviews (placeholder for future implementation)
const runReviewScraping = async (req, res) => {
  try {
    const { locationName } = req.body;

    if (!locationName) {
      return res.status(400).json({
        success: false,
        message: 'Tên địa điểm là bắt buộc'
      });
    }

    // Đường dẫn tới script Python (relative từ backend folder)
    const scriptPath = path.join(__dirname, '..', '..', 'crawler', 'execute', 'run_fetch_reviews.py');

    console.log(`Starting review scraping for location: ${locationName}`);

    // Chạy script Python với tham số locationName
    const result = await runPythonScript(scriptPath, [locationName]);
    
    res.json({
      success: true,
      message: `Thành công thu thập dữ liệu review cho ${locationName}`,
      output: result.stdout,
      stderr: result.stderr
    });

  } catch (error) {
    console.error('Error in review scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thu thập dữ liệu review',
      error: error.message
    });
  }
};

module.exports = {
  runListingInfoScraping,
  runReviewScraping
};
