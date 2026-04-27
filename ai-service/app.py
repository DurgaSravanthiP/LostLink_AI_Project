from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

class Item(BaseModel):
    title: str
    description: str
    location: str
    category: str

class MatchRequest(BaseModel):
    new_item: Item
    existing_items: List[Item]

from priority_agent import forward_chaining_inference

@app.post("/infer-priority")
def infer_priority(item: Item):
    text = f"{item.title} {item.description} {item.category}"
    result = forward_chaining_inference(text)
    return result

@app.post("/match")
def match_items(data: MatchRequest):
    texts = []

    new_text = f"{data.new_item.title} {data.new_item.description} {data.new_item.location}"
    texts.append(new_text)

    for item in data.existing_items:
        texts.append(f"{item.title} {item.description} {item.location}")

    if len(texts) < 2:
        return []

    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(texts)

    scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    results = []
    for i, score in enumerate(scores):
        results.append({
            "index": i,
            "score": float(score * 100)
        })

    return results