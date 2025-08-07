// Khởi tạo Google Identity khi trang tải xong
window.onload = () => {
    google.accounts.id.initialize({
        client_id: '643314900099-kcoo1iev0g768of4am5mc6n78c1bgqin.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        ux_mode: 'popup'
    });

    // Gắn sự kiện click vào nút Google
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
        google.accounts.id.prompt(); // mở popup đăng nhập
        });
    }
};

// Hàm xử lý phản hồi từ Google (có id_token)
async function handleCredentialResponse(response) {
    console.log('👉 Google response:', response);

    const id_token = response.credential;

    try {
    const res = await fetch('http://localhost:3000/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token })
    });

    const data = await res.json();

    if (res.ok) {
        // Lưu vào localStorage
        localStorage.setItem('userData', JSON.stringify({
            name: data.user.fullName,
            email: data.user.email,
            id: data.user.id
        }));

        localStorage.setItem('token', data.token);

        // Nếu chưa có số điện thoại → chuyển sang trang bổ sung
        // if (!data.user.phone) {
        //     // window.location.href = 'complete-profile.html';
        // } else {
            window.location.href = 'index.html';
        // }
    } else {
        alert('❌ Đăng nhập Google thất bại: ' + data.message);
    }
    } catch (err) {
        alert('❌ Lỗi kết nối đến server: ' + err.message);
    }
}
