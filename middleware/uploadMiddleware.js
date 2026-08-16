import multer from "multer";
import fs from "fs";
import path from "path";

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(
  process.cwd(),
  "uploads"
);

// Create uploads folder if it doesn't exist

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// =====================================================
// STORAGE
// =====================================================

const storage = multer.diskStorage({

  destination: function (
    req,
    file,
    cb
  ) {
    cb(
      null,
      uploadDir
    );
  },

  filename: function (
    req,
    file,
    cb
  ) {
    const uniqueName =
      Date.now() +
      "-" +
      file.originalname.replace(
        /\s+/g,
        "-"
      );

    cb(
      null,
      uniqueName
    );
  },

});

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,
});

export default upload;