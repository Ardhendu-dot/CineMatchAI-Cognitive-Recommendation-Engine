# -*- coding: utf-8 -*-
"""
CineMatch AI - High Performance Content-Based Filtering & Machine Learning Engine
Handles TF-IDF Vectorization, Feature Engineering, and Cosine Similarity matrices.
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Curated dataset aligned with CineMatch database
CURATED_MOVIES = [
    {
        'id': 'inception',
        'title': 'Inception',
        'year': 2010,
        'rating': 8.8,
        'genres': 'Sci-Fi Action Thriller',
        'director': 'Christopher Nolan',
        'cast': 'Leonardo DiCaprio Joseph Gordon-Levitt Tom Hardy Elliot Page',
        'keywords': 'dreams subconscious heist mind-bending time manipulation reality',
        'overview': 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.'
    },
    {
        'id': 'interstellar',
        'title': 'Interstellar',
        'year': 2014,
        'rating': 8.7,
        'genres': 'Sci-Fi Drama Adventure',
        'director': 'Christopher Nolan',
        'cast': 'Matthew McConaughey Anne Hathaway Jessica Chastain Michael Caine',
        'keywords': 'space travel black hole time dilation future saving humanity father daughter',
        'overview': 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.'
    },
    {
        'id': 'the-dark-knight',
        'title': 'The Dark Knight',
        'year': 2008,
        'rating': 9.0,
        'genres': 'Action Crime Drama Thriller',
        'director': 'Christopher Nolan',
        'cast': 'Christian Bale Heath Ledger Aaron Eckhart Maggie Gyllenhaal',
        'keywords': 'batman joker anarchy vigilante chaos hero vs villain corruption',
        'overview': 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.'
    },
    {
        'id': 'the-matrix',
        'title': 'The Matrix',
        'year': 1999,
        'rating': 8.7,
        'genres': 'Sci-Fi Action',
        'director': 'Lana Wachowski',
        'cast': 'Keanu Reeves Laurence Fishburne Carrie-Anne Moss Hugo Weaving',
        'keywords': 'simulation cyberpunk artificial intelligence dystopia machines rebellion virtual reality',
        'overview': 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth.'
    },
    {
        'id': 'blade-runner-2049',
        'title': 'Blade Runner 2049',
        'year': 2017,
        'rating': 8.0,
        'genres': 'Sci-Fi Mystery Thriller',
        'director': 'Denis Villeneuve',
        'cast': 'Ryan Gosling Harrison Ford Ana de Armas Sylvia Hoeks',
        'keywords': 'cyberpunk replicant future identity loneliness detective neon',
        'overview': 'A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what is left of society into chaos.'
    },
    {
        'id': 'pulp-fiction',
        'title': 'Pulp Fiction',
        'year': 1994,
        'rating': 8.9,
        'genres': 'Crime Drama',
        'director': 'Quentin Tarantino',
        'cast': 'John Travolta Samuel L. Jackson Uma Thurman Bruce Willis',
        'keywords': 'hitman nonlinear narrative gangster drugs boxing classic cool dialogue',
        'overview': 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in tales of violence and redemption.'
    },
    {
        'id': 'spirited-away',
        'title': 'Spirited Away',
        'year': 2001,
        'rating': 8.6,
        'genres': 'Animation Adventure Fantasy',
        'director': 'Hayao Miyazaki',
        'cast': 'Rumi Hiiragi Miyu Irino Mari Natsuki Takashi Naito',
        'keywords': 'anime spirits bathhouse magic coming of age fantasy world',
        'overview': 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.'
    },
    {
        'id': 'parasite',
        'title': 'Parasite',
        'year': 2019,
        'rating': 8.6,
        'genres': 'Thriller Drama Comedy',
        'director': 'Bong Joon Ho',
        'cast': 'Song Kang-ho Lee Sun-kyun Cho Yeo-jeong Choi Woo-shik',
        'keywords': 'social class deception family dynamic subtitled dark comedy secrets',
        'overview': 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.'
    },
    {
        'id': 'the-grand-budapest-hotel',
        'title': 'The Grand Budapest Hotel',
        'year': 2014,
        'rating': 8.1,
        'genres': 'Comedy Drama Adventure',
        'director': 'Wes Anderson',
        'cast': 'Ralph Fiennes F. Murray Abraham Mathieu Amalric Adrien Brody',
        'keywords': 'hotel concierge aesthetic whimsical dynamic duo legacy hearth-warming',
        'overview': 'A writer relates his adventures at a renowned European resort with a concierge who is wrongly accused of murder.'
    },
    {
        'id': 'whiplash',
        'title': 'Whiplash',
        'year': 2014,
        'rating': 8.5,
        'genres': 'Drama Music',
        'director': 'Damien Chazelle',
        'cast': 'Miles Teller J.K. Simmons Paul Reiser Melissa Benoist',
        'keywords': 'drummer jazz obsession strict teacher perfectionism ambition music school',
        'overview': 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an obsessive instructor.'
      }
]

class RecommendationEngine:
    def __init__(self):
        self.movies_df = pd.DataFrame(CURATED_MOVIES)
        self.similarity_matrix = None
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._build_similarity_matrix()

    def _build_similarity_matrix(self):
        # Feature Engineering: Combine features with weighted components
        # We give additional weight to genre and director by duplicating them in the tag pool
        self.movies_df['soup'] = (
            self.movies_df['genres'] + ' ' + 
            self.movies_df['genres'] + ' ' + 
            self.movies_df['keywords'] + ' ' + 
            self.movies_df['director'].apply(lambda x: x.replace(' ', '')) + ' ' + 
            self.movies_df['cast'] + ' ' + 
            self.movies_df['overview']
        )
        
        # Calculate TF-IDF matrix
        tfidf_matrix = self.vectorizer.fit_transform(self.movies_df['soup'])
        self.similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

    def get_recommendations(self, movie_title, num_recommendations=5):
        """
        Get similar movies by exact title match
        """
        try:
            # Find closest movie matching title
            idx = self.movies_df[self.movies_df['title'].str.lower() == movie_title.lower()].index[0]
            
            # Extract similarity scores
            sim_scores = list(enumerate(self.similarity_matrix[idx]))
            
            # Sort descending
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
            
            # Select top recommendations (excluding itself)
            sim_scores = [item for item in sim_scores if item[0] != idx][:num_recommendations]
            
            recommended_indices = [i[0] for i in sim_scores]
            scores = [round(i[1] * 100, 1) for i in sim_scores]
            
            results = []
            for i, score in zip(recommended_indices, scores):
                m_data = self.movies_df.iloc[i].to_dict()
                m_data['match_score'] = score
                results.append(m_data)
                
            return results
        except Exception as e:
            print(f"Error in similarity search: {e}")
            return []

    def export_pickle_files(self):
        """
        Saves representations to dictionary files for offline serving or portability.
        """
        os.makedirs('model', exist_ok=True)
        
        # Save movie dataframe dict
        with open('model/movie_dict.pkl', 'wb') as f:
            pickle.dump(self.movies_df.to_dict(orient='records'), f)
            
        # Save similarity matrix
        with open('model/similarity.pkl', 'wb') as f:
            pickle.dump(self.similarity_matrix, f)
            
        print("Model state successfully exported to pkl files inside model/ directory!")

if __name__ == '__main__':
    engine = RecommendationEngine()
    engine.export_pickle_files()
    recs = engine.get_recommendations('Inception', num_recommendations=3)
    print("\nTest Recommendations for 'Inception':")
    for r in recs:
        print(f" - {r['title']} ({r['year']}): Match Score: {r['match_score']}%")
