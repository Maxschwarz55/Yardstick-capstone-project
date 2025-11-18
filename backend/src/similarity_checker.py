# backend/src/similarity_checker.py
from flask import Flask, request, jsonify
from similarity_algorithm import get_face_similarity, compute_score, match_decision

app = Flask(__name__)

BUCKET_NAME = "your-bucket-name"  # S3 bucket where selfies are stored

@app.route("/api/check_similarity", methods=["POST"])
def check_similarity():
    data = request.get_json()
    input_person = data.get("input_person")
    db_person = data.get("db_person")

    # Compute face similarity if both photos exist
    face_similarity = 0.0
    if input_person.get("photo_s3_key") and db_person.get("photo_s3_key"):
        face_similarity = get_face_similarity(
            BUCKET_NAME,
            input_person["photo_s3_key"],
            db_person["photo_s3_key"]
        )

    score = compute_score(input_person, db_person, face_similarity)
    decision = match_decision(score)

    return jsonify({
        "score": score,
        "decision": decision
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000, debug=True)
