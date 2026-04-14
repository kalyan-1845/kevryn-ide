FROM node:20-slim

# Install system dependencies for node-pty and runtime compilers
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python-is-python3 \
    gcc \
    g++ \
    make \
    curl \
    default-jdk \
    golang \
    && rm -rf /var/lib/apt/lists/*

# Pre-Install Global Power-Libs (The "Training" Step)
RUN pip install --no-cache-dir numpy pandas scikit-learn fastapi uvicorn django flask requests
RUN npm install -g react react-dom next tailwindcss framer-motion lucide-react express mongoose axios

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Use npm start to run the server
CMD ["npm", "start"]
