FROM node:20

WORKDIR /usr/src/app

COPY . .
RUN npm install


# Expose the application port
EXPOSE 3000

# Command to run the application
# npm run start
CMD ["npm", "run", "start"]