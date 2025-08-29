FROM node:20

WORKDIR /usr/src/app

COPY . .
RUN yarn install


# Expose the application port
EXPOSE 3000

# Command to run the application
# yarn start
CMD ["yarn", "start"]