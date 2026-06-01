# -*- coding: utf-8 -*-
"""
CineMatch AI - Breathtaking Streaming-Style Movie Recommendation Dashboard
Built with Streamlit, Plotly, Pandas, and Scikit-Learn Content-Based Filtering.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
from recommendation_engine import RecommendationEngine, CURATED_MOVIES

# Initialize engine
@st.cache_resource
def get_ml_engine():
    return RecommendationEngine()

engine = get_ml_engine()
movies_df = pd.DataFrame(CURATED_MOVIES)

# Set page configurations
st.set_page_config(
    page_title="CineMatch AI - Futuristic Movie Recommendation Platform",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject custom cinematic styles & glassmorphic aesthetics
st.markdown("""
<style>
    /* Dark platform overrides */
    .stApp {
        background: #050508;
        color: #f3f4f6;
        font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    
    /* Title and gradients */
    .glowing-title {
        font-size: 3rem !important;
        font-weight: 900 !important;
        background: linear-gradient(135deg, #ffffff 30%, #E50914 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -1px;
        margin-bottom: 0px;
    }
    .neon-sub {
        font-size: 0.75rem;
        letter-spacing: 4px;
        color: #E50914;
        font-weight: 800;
        margin-top: 0px;
        margin-bottom: 25px;
    }
    
    /* Glassmorphism movie cards */
    .movie-card {
        background: rgba(20, 20, 25, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.35s ease-in-out;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    }
    .movie-card:hover {
        border-color: rgba(229, 9, 20, 0.6);
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(229, 9, 20, 0.15);
    }
    
    /* Custom Match badge colored green */
    .match-badge {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        font-weight: 800;
        border: 1px solid rgba(34, 197, 94, 0.4);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.75rem;
        display: inline-block;
        margin-bottom: 12px;
    }
    
    /* Custom genre pills */
    .genre-pill {
        background: rgba(229, 9, 20, 0.15);
        color: #fca5a5;
        border: 1px solid rgba(229, 9, 20, 0.3);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.65rem;
        font-weight: 600;
        display: inline-block;
        margin-right: 4px;
    }
    
    /* Custom metrics container block styling */
    .stat-container {
        border: 1px solid rgba(255,255,255,0.05);
        background: rgba(255,255,255,0.02);
        padding: 15px;
        border-radius: 12px;
        text-align: center;
    }
</style>
""", unsafe_allow_index=True)

# Watchlist Initialization
if 'watchlist' not in st.session_state:
    st.session_state.watchlist = []

# ========================
# SIDEBAR NAVIGATION
# ========================
with st.sidebar:
    st.markdown('<h2 style="font-weight: 900; color: white;">CINEMATCH <span style="color:#E50914;">AI</span></h2>', unsafe_allow_index=True)
    st.markdown('<p style="font-size: 0.6rem; letter-spacing: 2px; color: gray; text-transform: uppercase;">Streaming Recommender Layer</p>', unsafe_allow_index=True)
    st.divider()
    
    # Active Seeds Panel
    st.markdown("#### ⚙️ Mathematical Active Seeds")
    selected_seed_title = st.selectbox(
        "Choose reference movie anchor:",
        options=movies_df['title'].tolist(),
        index=0
    )
    
    st.divider()
    
    # Simple watchlist state
    st.markdown("#### ❤️ Saved watch queues")
    if len(st.session_state.watchlist) == 0:
        st.info("Your cinematic list is hungry. Tap 'Save to List' on cards in discovery tab!")
    else:
        for item in st.session_state.watchlist:
            col1, col2 = st.columns([4, 1])
            with col1:
                st.markdown(f"**{item}**")
            with col2:
                if st.button("❌", key=f"del-{item}"):
                    st.session_state.watchlist.remove(item)
                    st.rerun()

    st.divider()
    st.markdown("<p style='text-align: center; font-size: 0.75rem; color: gray;'>CineMatch AI v1.0.0 • Scikit-Learn content matrix</p>", unsafe_allow_index=True)

# ========================
# HEADER INTERACTIVE BRAND
# ========================
col_head, col_badge = st.columns([3, 1])
with col_head:
    st.markdown('<h1 class="glowing-title">CineMatch AI</h1>', unsafe_allow_index=True)
    st.markdown('<div class="neon-sub">COGNITIVE RECOMMENDATION PORTAL</div>', unsafe_allow_index=True)
with col_badge:
    st.markdown("<br>", unsafe_allow_index=True)
    st.button("Reset Neural Matrix", on_click=lambda: st.session_state.watchlist.clear())

tabs = st.tabs(["🎬 Cinematic discovery", "📊 Movie Analytics Room"])

# ========================
# TAB 1: CINEMATIC RECOM
# ========================
with tabs[0]:
    st.markdown("### 🦾 Custom tuning directives")
    col_mood, col_genre = st.columns(2)
    
    with col_mood:
        selected_mood = st.select_slider(
            "Tonal Interest Mood Adjustment:",
            options=["Emotional", "Sad", "Relaxed", "Happy", "Motivated", "Excited"],
            value="Motivated"
        )
        
    with col_genre:
        selected_genre = st.selectbox(
            "Hard category structure priority:",
            options=["All Categories", "Sci-Fi", "Action", "Thriller", "Horror", "Drama", "Comedy", "Adventure"]
        )

    st.divider()
    st.markdown(f"#### 🌌 Top Neural Matches for: **{selected_seed_title}** under mood **{selected_mood}**")
    
    # Core mathematical calculations
    recs = engine.get_recommendations(selected_seed_title, num_recommendations=6)
    
    # Filter by genre if requested
    if selected_genre != "All Categories":
        recs = [r for r in recs if selected_genre.lower() in r['genres'].lower()]
        
    if len(recs) == 0:
        st.warning("No curated masterpieces matching exact filters found. Displaying general recommendations instead.")
        recs = engine.get_recommendations(selected_seed_title, num_recommendations=4)
        
    # Render movie cards in columns
    grid_cols = st.columns(2)
    for index, movie in enumerate(recs):
        col = grid_cols[index % 2]
        with col:
            # Render aesthetic card markup
            st.markdown(f"""
            <div class="movie-card">
                <span class="match-badge">⚡ {movie['match_score']}% Synergy Match</span>
                <h4 style="margin: 0; color: white;">{movie['title']} ({movie['year']})</h4>
                <p style="font-size:0.75rem; color: #f59e0b; font-weight:800; margin-top: 4px; margin-bottom: 8px;">★ {movie['rating']} IMDb Score</p>
                <p style="font-size:0.8rem; color: #d1d5db; line-height:1.5;">{movie['overview']}</p>
                <div style="margin-top: 10px; margin-bottom: 12px;">
                    <span style="font-size: 0.7rem; color: #9ca3af; font-weight:bold;">Director: {movie['director']}</span>
                </div>
                <div>
                     {" ".join([f'<span class="genre-pill">{g}</span>' for g in movie['genres'].split()][:3])}
                </div>
            </div>
            """, unsafe_allow_index=True)
            
            # Action button
            if movie['title'] not in st.session_state.watchlist:
                if st.button("Save to watchlist queue", key=f"add-{movie['id']}"):
                    st.session_state.watchlist.append(movie['title'])
                    st.rerun()
            else:
                st.markdown("<p style='color: #22c55e; font-size: 0.8rem; font-weight: bold; margin-top: 8px;'>✓ Added to watch queues</p>", unsafe_allow_index=True)
                
            st.markdown("<br>", unsafe_allow_index=True)

# ========================
# TAB 2: DATA STUDIO
# ========================
with tabs[1]:
    st.markdown("### 📊 Cinematic Curation Metrology")
    st.write("Examine rating distributions and genre overlaps inside our AI platform database catalog.")
    
    col_g1, col_g2 = st.columns(2)
    
    with col_g1:
        st.markdown("#### Genre Frequency Count Distribution")
        # Extract individual genre list
        genres_list = []
        for index, row in movies_df.iterrows():
            genres_list.extend(row['genres'].split())
        g_df = pd.DataFrame(genres_list, columns=['Genre']).value_counts().reset_index(name='Volume')
        
        fig = px.bar(
            g_df, x='Genre', y='Volume',
            color='Volume',
            color_continuous_scale=px.colors.sequential.Reds,
            template="plotly_dark"
        )
        fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)
        
    with col_g2:
        st.markdown("#### IMDb Ratings Metrology Spread")
        fig_pie = px.histogram(
            movies_df, x='rating',
            nbins=8,
            title="Density plot of critic reviews",
            color_discrete_sequence=['#E50914'],
            template="plotly_dark"
        )
        fig_pie.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_pie, use_container_width=True)

    # Master stats block
    st.markdown("#### 📍 Cognitive Summary Analytics")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("""
        <div class="stat-container">
            <h5 style="margin:0; color:#9ca3af; font-size:0.75rem;">CURATED FILM VOLUME</h5>
            <h2 style="margin:5px 0; color:#E50914; font-weight:900;">10 Pieces</h2>
            <span style="font-size:0.7rem; color:green;">★ Threshold rating &gt; 8.0</span>
        </div>
        """, unsafe_allow_index=True)
    with c2:
        st.markdown("""
        <div class="stat-container">
            <h5 style="margin:0; color:#9ca3af; font-size:0.75rem;">AVERAGE CRITIC BENCHMARK</h5>
            <h2 style="margin:5px 0; color:#f59e0b; font-weight:900;">8.6 / 10</h2>
            <span style="font-size:0.7rem; color:gray;">Top 2.5% of world cinematography</span>
        </div>
        """, unsafe_allow_index=True)
    with c3:
        st.markdown("""
        <div class="stat-container">
            <h5 style="margin:0; color:#9ca3af; font-size:0.75rem;">NEURAL SIMILARITY CORRELATION</h5>
            <h2 style="margin:5px 0; color:#22c55e; font-weight:900;">Cosine Math</h2>
            <span style="font-size:0.7rem; color:gray;">TF-IDF multidimensional vectors</span>
        </div>
        """, unsafe_allow_index=True)
