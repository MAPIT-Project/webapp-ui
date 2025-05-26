## Project demo setup 

> The way this is done is not ideal and needs improvement. 

1. Install requirements
- > Node JS, Git, Supabase (CLI), Docker, PM2, Nginx

2. Create SSH key

3. Add SSH key to your github account

4. Git clone the webapp-ui repository 

5. CD into the supabase_cli folder and run `supabase start`
- > Save the output in the console since we are going to need the anon key later on for the .env file

6. Reconnect to the server using ssh with ssh port forwarding  
`ssh -L 54321:localhost:54321 -L 54322:localhost:54322 -L 54323:localhost:54323 -L 54324:localhost:54324 username@ip_address`  

7. Inside of this repository remove all data in src/lib/server/db/migrations

8. Run `npm run db:generate`
- >This will create a SQL file to create the schema that is defined in src/lib/server/db/schema.ts

9. Run the generated SQL inside of supabase studio
- > Head over to http://127.0.0.1:54323/project/default/sql/new  
- > To verify if it was successful by checking the schema visualizer

10. Create nginx config file
- > sudo nano /etc/nginx/sites-available/webapp

11. Copy config into the file
```json
server {
    listen 80;
    server_name your-vps-ip-address;  # Replace with your actual IP
    
    # Your SvelteKit app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

12. Enable the config
```bash
# Link the config to enabled sites
sudo ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/

# Remove default nginx page
sudo rm /etc/nginx/sites-enabled/default

# Test config is valid
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

13. Install Node JS dependencies
- > In the root directory of this repo run `npm install`

14. Create the .env file
- > Run `cp .env.example .env`

15. Fill the .env file with the required data
- > Run `nano .env`

16. Build the application
- > npm run build

17. Start the application using PM2
- > `pm2 start build/index.js --name webapp-ui --env .env`

18. Enable PM2 to start on boot
- > pm2 startup
- > pm2 save

19. If apache2 is installed disable this and restart nginx