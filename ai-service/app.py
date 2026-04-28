from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from priority_agent import forward_chaining_inference

app = FastAPI()


class Item(BaseModel):
    title: str
    description: str
    location: str
    category: str


class MatchRequest(BaseModel):
    new_item: Item
    existing_items: List[Item]


@app.post("/infer-priority")
def infer_priority(item: Item):
    text = f"{item.title} {item.description} {item.category}"
    return forward_chaining_inference(text)


@app.post("/match")
def match_items(data: MatchRequest):
    new_text = f"{data.new_item.title} {data.new_item.description} {data.new_item.location}"
    texts = [new_text] + [
        f"{item.title} {item.description} {item.location}"
        for item in data.existing_items
    ]

    if len(texts) < 2:
        return []

    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(texts)
    scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    return [{"index": i, "score": float(score * 100)} for i, score in enumerate(scores)]