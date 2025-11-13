import requests
from rapidfuzz import fuzz, utils
import boto3

rekognition = boto3.client("rekognition")

def get_face_similarity(img_url, db_img_url):
    try:
        img1_bytes = requests.get(img_url).content
        img2_bytes = requests.get(db_img_url).content
        response = rekognition.compare_faces(
            SourceImage={'Bytes': img1_bytes},
            TargetImage={'Bytes': img2_bytes},
            SimilarityThreshold=0
        )
        matches = response.get("FaceMatches", [])
        return matches[0]["Similarity"] if matches else 0.0
    except Exception:
        return 0.0  # Image is missing or inaccessible

def compute_score(input_person, record, face_similarity):
    score = 0

    # Face similarity (0-3 points)
    score += 2 * (face_similarity / 100)

    # Name similarity (0-2 points)
    first_sim = fuzz.ratio(
        utils.default_process(input_person["first_name"]),
        utils.default_process(record["first_name"])
    ) / 100.0
    last_sim = fuzz.ratio(
        utils.default_process(input_person["last_name"]),
        utils.default_process(record["last_name"])
    ) / 100.0
    average_sim = (first_sim + last_sim) / 2
    score += 2 * average_sim  # average scaling

    # DOB (0-3 points)
    if input_person["dob"] == record["dob"]:
        score += 3

    # Address similarity (0-3 points)
    addr_sim = fuzz.token_set_ratio(
        utils.default_process(input_person.get("address", "")),
        utils.default_process(record.get("address", ""))
    ) / 100.0
    score += 3 * addr_sim

    return round(score, 2)

def match_decision(score):
    if score >= 8:
        return "Likely same person"
    elif score >= 5:
        return "Possible match (manual review needed)"
    else:
        return "Likely different person"

# Example usage
input_person = {
    "first_name": "Jane",
    "last_name": "Doe",
    "dob": "1990-03-14",
    # "photo_url": optional
}

db_record = {
    "first_name": "Janie",
    "last_name": "Doe",
    "dob": "1990-03-14",
    "photo_url": "https://example.com/photo.jpg"
}

# Only compute face similarity if input has a photo
face_sim = 0
if input_person["photo_url"]:
    face_sim = get_face_similarity(input_person["photo_url"], db_record["photo_url"])

score = compute_score(input_person, db_record, face_sim)
decision = match_decision(score)

print(f"Score: {score}/10 → {decision}")