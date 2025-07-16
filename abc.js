
//0) Load the YouTube IFrame Player API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

let player;
let lastTenInterval = null;

/**
 * 1) Called by the YouTube API once it's ready.
 *    We don't auto-init here; we create the player on first search.
 */
function onYouTubeIframeAPIReady() {
  // no-op
}

/**
 * 2) When the video ends, hide the container so no related videos show.
 */
function onPlayerStateChange(event) {
  const overlay = document.querySelector('#video-container .end-overlay');
  
  if (event.data === YT.PlayerState.PLAYING) {
    // start polling every 250 ms
    if (!lastTenInterval) {
      lastTenInterval = setInterval(() => {
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        if (dur - cur <= 20) {
          clearInterval(lastTenInterval);
          lastTenInterval = null;
          
          overlay.classList.add('show');
        }
      }, 250);
    }
  } else {
    // paused, buffering, ended, etc. — stop polling
    if (lastTenInterval) {
      clearInterval(lastTenInterval);
      lastTenInterval = null;
    }
  }

  if (event.data === YT.PlayerState.ENDED) {
    overlay.classList.add('block');
  }

  if (event.data === YT.PlayerState.PAUSED) {
    const topmask = document.getElementsByClassName('yt-top-mask');
    if (topmask[0]) {
      topmask[0].classList.add("paused");
    }
  }

  if (event.data === YT.PlayerState.PLAYING) {
    const topmask = document.getElementsByClassName('yt-top-mask');
    if (topmask[0]) {
      topmask[0].classList.remove("paused");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ──────────── your NCERT & channel data ────────────
  const ncertData = {
    "11": {
      Chemistry: [
        { name: "Some Basic Concepts of Chemistry", topics: ["Mole Concept", "Atomic Structure"] },
        { name: "Structure of Atom", topics: ["Quantum Mechanical Model", "Electronic Configuration"] }
      ],
      Physics: [
        { name: "Physical World and Measurement", topics: ["Units and Measurements", "Dimensional Analysis"] }
      ],
      Mathematics: [
        { name: "Sets", topics: ["Introduction to Sets", "Operations on Sets"] }
      ],
      Biology: [
        { name: "The Living World", topics: ["Diversity of Living Organisms", "Taxonomy"] }
      ]
    },
    "12": {
      Chemistry: [
        { name: "Solid State", topics: ["Types of Solids", "Crystal Structure"] },
        { name: "Solutions", topics: ["Concentration Terms", "Colligative Properties"] }
      ],
      Physics: [
        { name: "Electrostatics", topics: ["Electric Charges", "Coulomb's Law"] }
      ],
      Mathematics: [
        { name: "Relations and Functions", topics: ["Types of Relations", "Functions"] }
      ],
      Biology: [
        { name: "Reproduction", topics: ["Sexual Reproduction", "Asexual Reproduction"] }
      ]
    }
  };

  const trustedChannels = [
    "UCX6b17PVsYBQ0ip5gyeme-Q",
    "UCSHYhwrnJzsiQ47EKmVeK2g",
    "UC58v9cLitc8VaCjrcKyAbrw",
    "UC9KLae46Ed-5kK7U3DG4VXQ",
    "UCZ-WIQJYrVKXhqt6OQslNvg",
    "UC8ud3h8h9o2YExo-MB2tySQ",
    "UC6nrXcYz3c7F8vdhZPKU5Ig",
    "UCReoZ2jjKdk8nFtrZW05qhQ"
  ];

  const API_KEY = "AIzaSyDgoE2tohVjKNPfk9LSTjJHtn93uVhN-9k";

  // ──────────── form & UI refs ────────────
  const chapterSelect = document.getElementById("chapter");
  const topicSelect = document.getElementById("topic");
  const focusSelect = document.getElementById("focus");
  const languageSelect = document.getElementById("language");
  const form = document.getElementById("searchForm");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");

  // Track selected values
  let selectedGrade = "";
  let selectedSubject = "";

  // simple show/hide helpers
  function showLoading() {
    loadingEl.classList.remove("hidden");
    loadingEl.classList.add("show");
  }
  function hideLoading() {
    loadingEl.classList.add("hidden");
    loadingEl.classList.remove("show");
  }
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
    errorEl.classList.add("show");
  }
  function hideError() {
    errorEl.classList.add("hidden");
    errorEl.classList.remove("show");
  }

  // Handle button group selections
  const buttonGroups = document.querySelectorAll('.button-group');
  
  buttonGroups.forEach(group => {
    const buttons = group.querySelectorAll('.button-option');
    
    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove selected class from all buttons in this group
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        this.classList.add('selected');
        
        // Store the selected value
        const groupId = group.id;
        const selectedValue = this.dataset.value;
        
        if (groupId === 'grade') {
          selectedGrade = selectedValue;
          selectedSubject = ""; // Reset subject when grade changes
          // Reset subject selection
          const subjectButtons = document.querySelectorAll('#subject .button-option');
          subjectButtons.forEach(btn => btn.classList.remove('selected'));
          // Reset dropdowns
          resetChapterAndTopic();
        } else if (groupId === 'subject') {
          selectedSubject = selectedValue;
          updateChapterDropdown();
        }
      });
    });
  });

  function resetChapterAndTopic() {
    chapterSelect.disabled = true;
    chapterSelect.innerHTML = '<option value="" disabled selected>-- Choose Chapter --</option>';
    topicSelect.disabled = true;
    topicSelect.innerHTML = '<option value="" disabled selected>-- Choose Topic --</option>';
  }

  function updateChapterDropdown() {
    chapterSelect.innerHTML = '<option value="" disabled selected>-- Choose Chapter --</option>';
    topicSelect.innerHTML = '<option value="" disabled selected>-- Choose Topic --</option>';
    topicSelect.disabled = true;

    if (!selectedGrade || !selectedSubject) {
      chapterSelect.disabled = true;
      return;
    }

    const chapters = ncertData[selectedGrade]?.[selectedSubject] || [];
    if (!chapters.length) {
      chapterSelect.disabled = true;
      return;
    }

    chapterSelect.disabled = false;
    chapters.forEach(ch => {
      const opt = document.createElement("option");
      opt.value = ch.name;
      opt.textContent = ch.name;
      chapterSelect.appendChild(opt);
    });
  }

  chapterSelect.addEventListener("change", () => {
    const chapter = chapterSelect.value;

    topicSelect.innerHTML = '<option value="" disabled selected>-- Choose Topic --</option>';
    if (!selectedGrade || !selectedSubject || !chapter) {
      topicSelect.disabled = true;
      return;
    }

    const chapters = ncertData[selectedGrade]?.[selectedSubject] || [];
    const chapData = chapters.find(c => c.name === chapter);
    if (!chapData) {
      topicSelect.disabled = true;
      return;
    }

    topicSelect.disabled = false;
    chapData.topics.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      topicSelect.appendChild(opt);
    });
  });

  // Helper function to parse YouTube duration
  function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async function fetchYouTubeVideos(query, languageCode, maxVideos = 250) {
    const allVideos = [];
    let nextPageToken;
    do {
      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50`
                    + `&q=${encodeURIComponent(query)}&relevanceLanguage=${languageCode}&key=${API_KEY}`;
      if (nextPageToken) {
        searchUrl += `&pageToken=${nextPageToken}`;
      }
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) break;
      const searchData = await searchRes.json();
      nextPageToken = searchData.nextPageToken;
      if (!searchData.items || !searchData.items.length) break;
      const videoIds = searchData.items.map(i => i.id.videoId).filter(Boolean);
      for (let i = 0; i < videoIds.length && allVideos.length < maxVideos; i += 50) {
        const batchIds = videoIds.slice(i, i + 50).join(",");
        const vidsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${batchIds}&key=${API_KEY}`);
        if (!vidsRes.ok) continue;
        const vidsData = await vidsRes.json();
        if (vidsData.items && vidsData.items.length) {
          const processed = vidsData.items
            .filter(v => v.status?.embeddable)
            .map(v => ({
              videoId: v.id,
              title: v.snippet.title,
              description: v.snippet.description || "",
              views: parseInt(v.statistics.viewCount || 0),
              likes: parseInt(v.statistics.likeCount || 0),
              positiveComments: Math.floor((parseInt(v.statistics.likeCount || 0) || 0) * 0.2),
              publishedAt: v.snippet.publishedAt,
              durationSeconds: parseDuration(v.contentDetails.duration),
              channelId: v.snippet.channelId
            }))
            .filter(v => v.durationSeconds >= 300); // Discard videos shorter than 5 minutes

          allVideos.push(...processed);
          if (allVideos.length >= maxVideos) break;
        }
      }
      await new Promise(r => setTimeout(r, 100));
    } while (nextPageToken && allVideos.length < maxVideos);
    return allVideos.slice(0, maxVideos);
  }

  const videoCache = new Map();
  async function getCachedVideos(query, lang, maxVideos = 250) {
    const key = `${query}||${lang}||${maxVideos}`;
    if (videoCache.has(key)) return videoCache.get(key);
    const vids = await fetchYouTubeVideos(query, lang, maxVideos);
    videoCache.set(key, vids);
    return vids;
  }

  function estimateStudentWatch(video) {
    const likeRatio = video.likes / Math.max(video.views, 1);
    const commentRatio = video.positiveComments / Math.max(video.views, 1);
  
    let watchPercentage;
    if (video.durationSeconds < 600) {
      watchPercentage = 0.85;
    } else if (video.durationSeconds < 1200) {
      watchPercentage = 0.6;
    } else {
      watchPercentage = 0.4;
    }
  
    if (likeRatio > 0.05) {
      watchPercentage += 0.05;
    }
  
    let baseWatchTime = Math.min(watchPercentage, 0.9);
  
    baseWatchTime -= likeRatio;
    baseWatchTime -= commentRatio;
  
    const likeBonus = likeRatio * 0.5;
    const commentBonus = commentRatio * 0.6;
  
    const finalWatchTime = baseWatchTime + likeBonus + commentBonus;
  
    return finalWatchTime;
  }

  function rankVideo(video, searchTerms, exactTopic) {
    if (video.views < 200) {
      return { totalScore: 0, reason: "Too few views" };
    }
  
    const logViews = Math.log10(video.views + 1);
  
    // Laplace smoothing for ratios
    const likeRatio = (video.likes + 1) / (video.views + 10);
    const posCommentRatio = (video.positiveComments + 1) / (video.views + 10);
  
    // More aggressive scaling for low views
    const viewFactor = Math.min(Math.pow(video.views / 2000, 2), 1);
    const scaledLikeRatio = likeRatio * viewFactor;
    const scaledCommentRatio = posCommentRatio * viewFactor;
  
    let normLikeRatio = (scaledLikeRatio - 0.005) / (0.1 - 0.005);
    normLikeRatio = Math.min(Math.max(normLikeRatio, 0), 1) * 9 + 1;
  
    let normCommentRatio = (scaledCommentRatio - 0.001) / (0.05 - 0.001);
    normCommentRatio = Math.min(Math.max(normCommentRatio, 0), 1) * 9 + 1;
  
    const estWatch = estimateStudentWatch(video);
    const logWatch = Math.log10(estWatch + 1);
    let normWatch = (logWatch - 0.3) / (0.69 - 0.3);
    normWatch = Math.min(Math.max(normWatch, 0), 1) * 9 + 1;
  
    let posWeight = (posCommentRatio > 0.3 && video.views > 50000) ? 0.40 : 0.20;
    let viewsWeight = posWeight === 0.40 ? 0.30 : 0.35;
    let likeWeight = posWeight === 0.40 ? 0.25 : 0.30;
    const watchWeight = 0.15;
  
    const topicBonus = searchTerms.every(t =>
      video.title.toLowerCase().includes(t.toLowerCase())
    ) ? 3 : 0;
  
    const channelBoost = trustedChannels.includes(video.channelId) ? 1.2 : 1;
  
    const exactBonus = video.title.toLowerCase().includes(exactTopic.toLowerCase()) ? 5 : 0;
  
    const baseScore = (
      logViews * viewsWeight +
      normLikeRatio * likeWeight +
      normCommentRatio * posWeight +
      normWatch * watchWeight
    );
  
    // Penalize low views by scaling baseScore
    const viewPenalty = video.views < 1000 ? (video.views / 1000) : 1;
  
    const totalScore = baseScore * channelBoost * viewPenalty + topicBonus + exactBonus;
  
    return {
      totalScore,
      logViews,
      normLikeRatio,
      normCommentRatio,
      normWatch,
      posWeight,
      viewsWeight,
      likeWeight,
      watchWeight,
      channelBoost,
      topicBonus,
      exactBonus,
      viewPenalty,
    };
  }
  
  async function showVideoResult(video, searchTerms, totalVideosAnalyzed) {
    hideLoading();
    hideError();
  
    // Hide placeholder and show video player
    const placeholderContent = document.querySelector('.placeholder-content');
    const videoPlayer = document.getElementById('video-player');
    
    if (placeholderContent) {
      placeholderContent.style.display = 'none';
    }
    if (videoPlayer) {
      videoPlayer.style.display = 'block';
    }

    // Update ranking score display
    const rankingScore = document.querySelector('.ranking-score');
    if (rankingScore) {
      const { totalScore } = rankVideo(video, searchTerms, topicSelect.value);
      rankingScore.innerHTML = `⭐ Ranking Score: ${totalScore.toFixed(3)} <small>(${totalVideosAnalyzed} videos analyzed)</small>`;
    }
  
    if (player) {
      player.loadVideoById(video.videoId);
    } else {
      player = new YT.Player("video-player", {
        videoId: video.videoId,
        width: '100%',
        height: '400',
        playerVars: {
          rel: 0,
          enablejsapi: 1,
          disablekb: 1,
          fs: 0
        },
        events: {
          onStateChange: onPlayerStateChange
        }
      });
    }
  }

  // ──────────── form submit ────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    showLoading();

    const chapter = chapterSelect.value;
    const topic = topicSelect.value;
    const focus = focusSelect.value;
    const lang = languageSelect.value;

    if (!selectedGrade || !selectedSubject || !chapter || !topic || !lang) {
      hideLoading();
      showError("Please fill all required fields including language.");
      return;
    }
    if (selectedGrade !== "11" && selectedGrade !== "12") {
      hideLoading();
      showError("Grade must be 11 or 12.");
      return;
    }

    const searchTerms = [`Grade ${selectedGrade}`, selectedSubject, chapter, topic];
    if (focus) searchTerms.push(focus.toUpperCase());
    const query = searchTerms.join(" ");

    try {
      // Update loading message to show progress
      const originalLoadingText = loadingEl.textContent;
      loadingEl.textContent = "Searching for videos... This may take a moment for comprehensive results.";
      
      const videos = await getCachedVideos(query, lang, 250);
      
      if (!videos.length) {
        throw new Error("No videos found matching strict language criteria.");
      }
      
      console.log(`Ranking ${videos.length} videos...`);
      videos.forEach(v => {
        const ranking = rankVideo(v, searchTerms, topic);
        v.score = ranking.totalScore;
        v.ranking = ranking;
      });
      
      videos.sort((a, b) => b.score - a.score);
      
      console.log("Top 10 videos by score:");
      videos.slice(0, 10).forEach((v, i) => {
        console.log(`${i + 1}. ${v.title} (Score: ${v.score.toFixed(3)})`);
      });
      
      await showVideoResult(videos[0], searchTerms, videos.length);
      
      // Reset loading text
      loadingEl.textContent = originalLoadingText;
      
    } catch (err) {
      console.error("Search error:", err);
      hideLoading();
      showError("Error: " + err.message);
    }
  });

  // Handle overlay buttons
  const overlay = document.querySelector('#video-container .end-overlay');
  const rewatchBtn = document.getElementById('rewatch-button');
  const playBtn = document.getElementById('play-button');

  if (rewatchBtn) {
    rewatchBtn.addEventListener('click', () => {
      if (overlay) {
        overlay.classList.remove('show');
        overlay.classList.remove('block');
      }
      if (player && player.playVideo) {
        player.playVideo();
      }
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (player && player.playVideo) {
        player.playVideo();
      }
    });
  }
});

