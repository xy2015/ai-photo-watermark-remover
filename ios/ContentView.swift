import SwiftUI

struct ContentView: View {
    @State private var currentMode: AppMode = .smart
    @State private var showImagePicker = false
    @State private var selectedImage: UIImage?
    
    enum AppMode {
        case smart
        case manual
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if selectedImage == nil {
                    uploadView
                } else {
                    editorView
                }
            }
            .navigationTitle("ClearWater")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {}) {
                        Image(systemName: "moon.fill")
                    }
                }
            }
        }
    }
    
    private var uploadView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 80))
                .foregroundColor(.gray)
            
            Text("上传图片开始处理")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("支持 JPG、PNG、WebP 格式")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button(action: { showImagePicker = true }) {
                Text("选择图片")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: "6366F1"))
                    .cornerRadius(12)
            }
            .padding(.horizontal, 40)
            .padding(.top, 16)
            
            Spacer()
        }
        .sheet(isPresented: $showImagePicker) {
            ImagePicker(image: $selectedImage)
        }
    }
    
    private var editorView: some View {
        VStack(spacing: 0) {
            modeSelector
            
            if let image = selectedImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            
            controlPanel
        }
    }
    
    private var modeSelector: some View {
        HStack(spacing: 0) {
            ModeButton(title: "智能模式", isActive: currentMode == .smart) {
                currentMode = .smart
            }
            ModeButton(title: "手动模式", isActive: currentMode == .manual) {
                currentMode = .manual
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
    
    private var controlPanel: some View {
        VStack(spacing: 16) {
            if currentMode == .smart {
                smartModePanel
            } else {
                manualModePanel
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: -5)
    }
    
    private var smartModePanel: some View {
        VStack(spacing: 12) {
            HStack {
                Text("智能去水印")
                    .font(.headline)
                Spacer()
                Text("AI驱动")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "6366F1"), Color(hex: "10B981")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(20)
            }
            
            Button(action: {}) {
                HStack {
                    Image(systemName: "wand.and.stars")
                    Text("一键去除全部")
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(hex: "6366F1"))
                .cornerRadius(12)
            }
        }
    }
    
    private var manualModePanel: some View {
        VStack(spacing: 12) {
            HStack {
                Text("手动精准修复")
                    .font(.headline)
                Spacer()
            }
            
            HStack(spacing: 12) {
                Button(action: {}) {
                    Image(systemName: "selection.rectangular")
                        .font(.title2)
                        .foregroundColor(.gray)
                        .frame(width: 50, height: 50)
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                }
                
                Button(action: {}) {
                    Image(systemName: "paintbrush.pointed")
                        .font(.title2)
                        .foregroundColor(.gray)
                        .frame(width: 50, height: 50)
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Text("修复")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color(hex: "6366F1"))
                        .cornerRadius(10)
                }
            }
        }
    }
}

struct ModeButton: View {
    let title: String
    let isActive: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isActive ? .primary : .secondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(isActive ? Color(.systemBackground) : Color.clear)
                .cornerRadius(8)
        }
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            
            guard let provider = results.first?.itemProvider else { return }
            
            if provider.canLoadObject(ofClass: UIImage.self) {
                provider.loadObject(ofClass: UIImage.self) { image, _ in
                    self.parent.image = image as? UIImage
                }
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: 
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: 
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: 
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
