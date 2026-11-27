use tauri::WebviewWindow;

#[tauri::command]
fn minimize(window: WebviewWindow) {
    let _ = window.minimize();
}

#[tauri::command]
fn close_app(window: WebviewWindow) {
    let _ = window.close();
}

#[tauri::command]
fn toggle_fullscreen(window: WebviewWindow) {
    let current = window.is_fullscreen().unwrap_or(false);
    let _ = window.set_fullscreen(!current);
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![minimize, close_app, toggle_fullscreen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
