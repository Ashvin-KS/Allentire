import os

ENV_FILE = '.env'

REQUIRED_KEYS = [
    ('VITE_A4F_API_KEY', 'Enter your Brain View API Key (A4F)'),
    ('GOOGLE_CLIENT_ID', 'Enter your Google Client ID'),
    ('GOOGLE_CLIENT_SECRET', 'Enter your Google Client Secret'),
]

def main():
    print("🚀 Nexus OS Environment Setup (Python Edition)\n")
    
    current_env = {}
    if os.path.exists(ENV_FILE):
        print(f"ℹ️  Found existing {ENV_FILE}. Merging new values...\n")
        with open(ENV_FILE, 'r') as f:
            for line in f:
                if '=' in line:
                    key, val = line.strip().split('=', 1)
                    current_env[key] = val

    new_env = current_env.copy()

    for key, prompt in REQUIRED_KEYS:
        if key in current_env and current_env[key]:
            print(f"✅ {key} is already set.")
            # Optional: Ask to overwrite? For simplicity, skip if present.
            continue
            
        value = input(f"{prompt}: ").strip()
        if value:
            new_env[key] = value

    # Write back to .env
    with open(ENV_FILE, 'w') as f:
        for key, value in new_env.items():
            f.write(f"{key}={value}\n")

    print(f"\n✨ Configuration saved to {ENV_FILE}!")
    print("👉 You can now run `npm run dev` to start the app.")

if __name__ == '__main__':
    main()
