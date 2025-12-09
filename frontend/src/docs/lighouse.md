# Lighthouse IPFS Upload – Reference

This document explains how we use the [`@lighthouse-web3/sdk`](https://www.npmjs.com/package/@lighthouse-web3/sdk) package to upload files to IPFS from a React frontend.

---

## 1. Installation

Install the Lighthouse SDK:

```bash
npm install @lighthouse-web3/sdk
# or
yarn add @lighthouse-web3/sdk
2. API Key
You need a Lighthouse API key.

Sign up / log in at Lighthouse

Generate an API key from their dashboard

In the code, never hardcode the key in the frontend for production.
For now, in local dev, it’s written directly as "YOUR_API_KEY".

Recommended pattern for serious use:

Store it in a backend and expose a signed auth token
or

Use environment variables and server-side upload flows.

3. Basic React Usage
We use a simple React component with:

An <input type="file" /> element

An uploadFile function that calls lighthouse.upload

A progressCallback function to track upload progress

3.1. Progress Callback
js
Copy code
const progressCallback = (progressData) => {
  // progressData.total -> total bytes
  // progressData.uploaded -> uploaded bytes

  const percentageDone = (
    (progressData?.uploaded / progressData?.total) *
    100
  ).toFixed(2);

  console.log(`Upload progress: ${percentageDone}%`);
};
Note: This computes how much of the file is uploaded as a percentage.

3.2. uploadFile Function
js
Copy code
import lighthouse from "@lighthouse-web3/sdk";

const uploadFile = async (file) => {
  try {
    // file can be:
    // - a single File
    // - a FileList / array of Files (for multiple upload)
    // Here we pass a single file.

    const output = await lighthouse.upload(
      file,
      "YOUR_API_KEY",     // TODO: replace with real API key / secure flow
      null,               // for multiple files: set this to 'true'
      progressCallback    // optional; to track progress
    );

    console.log("File Status:", output);
    /*
      Example output:
      {
        data: {
          Name: "filename.txt",
          Size: 88000,
          Hash: "QmWNmn2gr4ZihNPqaC5oTeePsHvFtkWNpjY3cD6Fd5am1w"
        }
      }

      Note: Hash in response is the IPFS CID.
    */

    const cid = output.data.Hash;
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    console.log("View your file at:", gatewayUrl);
  } catch (error) {
    console.error("Lighthouse upload error:", error);
  }
};
3.3. React Component Example
jsx
Copy code
import React from "react";
import lighthouse from "@lighthouse-web3/sdk";

function App() {
  const progressCallback = (progressData) => {
    const percentageDone = (
      (progressData?.uploaded / progressData?.total) *
      100
    ).toFixed(2);
    console.log(`Upload progress: ${percentageDone}%`);
  };

  const uploadFile = async (file) => {
    try {
      const output = await lighthouse.upload(
        file,
        "YOUR_API_KEY",
        null,
        progressCallback
      );

      console.log("File Status:", output);
      const cid = output.data.Hash;
      console.log(
        "Visit at https://gateway.lighthouse.storage/ipfs/" + cid
      );
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Single file upload – take the first file
    const file = files[0];
    uploadFile(file);
  };

  return (
    <div className="App">
      <input type="file" onChange={handleFileChange} />
    </div>
  );
}

export default App;
4. Accessing the Uploaded File
Given the response:

json
Copy code
{
  "data": {
    "Name": "filename.txt",
    "Size": 88000,
    "Hash": "QmWNmn2gr4ZihNPqaC5oTeePsHvFtkWNpjY3cD6Fd5am1w"
  }
}
Hash is the CID.

Public URL format:

text
Copy code
https://gateway.lighthouse.storage/ipfs/<CID>
Example:

text
Copy code
https://gateway.lighthouse.storage/ipfs/QmWNmn2gr4ZihNPqaC5oTeePsHvFtkWNpjY3cD6Fd5am1w
5. Multiple File Uploads (Concept)
The SDK also supports multiple files at once.
You’d pass a FileList or array of File objects and set the third argument (for multiple files) accordingly, depending on the SDK’s current API.

For now, our implementation focuses on single-file uploads from the React file input.

6. Notes / Important Points
This example runs entirely on the frontend.

For production:

Avoid exposing raw API keys

Prefer backend or signed upload flows.

The progressCallback is optional but useful for UX.

We log the gateway URL so it can be persisted in our own backend / smart contracts as needed (e.g., storing the CID on-chain for hackathon metadata, team profiles, project reports, etc.).

