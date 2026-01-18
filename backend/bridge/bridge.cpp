#include <pybind11/pybind11.h>
#include <string>

namespace py = pybind11;

// A simple wrapper that we can expand once the "Hook" is working
class PlaceholderProcessor {
public:
    PlaceholderProcessor(std::string key) : license_key(key) {}
    std::string process(std::string data) { 
        return "C++ Engine Active. Processing: " + data; 
    }
private:
    std::string license_key;
};

PYBIND11_MODULE(smart_spectra_py, m) {
    py::class_<PlaceholderProcessor>(m, "Processor")
        .def(py::init<std::string>())
        .def("process_frame", &PlaceholderProcessor::process);
}