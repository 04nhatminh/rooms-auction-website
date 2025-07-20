class UserModel {
    constructor(fullName, email, hashPassword, phoneNumber, avatarURL, isVerified, rating) {
        this.fullName = fullName;
        this.email = email;
        this.hashPassword = hashPassword;
        this.phoneNumber = phoneNumber;
        this.avatarURL = avatarURL;
        this.isVerified = isVerified;
        this.rating = rating;
    }
}