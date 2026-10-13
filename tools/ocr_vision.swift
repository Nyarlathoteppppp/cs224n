// Usage: ocr <image> ...  → prints recognized text of each image, separated by "<!-- file -->" markers.
import Foundation
import Vision
import AppKit

for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["zh-Hans", "en-US"]
    req.usesLanguageCorrection = true
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    print("<!-- \((path as NSString).lastPathComponent) -->")
    for obs in req.results ?? [] { if let t = obs.topCandidates(1).first { print(t.string) } }
    print("")
}
