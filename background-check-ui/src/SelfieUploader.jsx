import React, { useState } from "react";

export default function SelfieUploader({ personId, onUploadComplete }) {
  const [status, setStatus] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Requesting upload URL...");

    const res = await fetch("/selfie/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId })
    });
    const { uploadUrl, s3Key } = await res.json();

    setStatus("Uploading to S3...");
    await fetch(uploadUrl, { method: "PUT", body: file });

    setStatus("Upload complete!");
    onUploadComplete(s3Key); // pass S3 key to parent component
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <p>{status}</p>
    </div>
  );
}
