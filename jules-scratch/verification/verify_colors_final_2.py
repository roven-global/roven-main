from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5178/")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="jules-scratch/verification/verification_final_2.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
